import { prisma } from "@/lib/prisma";
import { formatarMoeda, mesAtual, limitesDoMes } from "@/lib/financeiro";
import {
  calcularTotalRetiradoNoMes,
  calcularTotalRetiradoUltimos3Meses,
  marcarRetiradasAcimaDoRecomendado,
} from "@/lib/retiradas";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";
import { calcularRetiradaIdeal } from "@/lib/caixa-livre";
import { calcularCaixaLivre } from "@/lib/caixa-livre-calculo";
import { buscarMeuCustoDeVida, buscarSomaCustoDeVidaAtivo } from "@/lib/custo-de-vida";
import { calcularDiagnosticoRenda, LIMITE_SOBRA_MEDIA_SAUDAVEL } from "@/lib/diagnostico-renda";
import { calcularMediaFinanceira3Meses } from "@/lib/diagnostico-renda-calculo";
import { calcularMargemContribuicao } from "@/lib/calculos";
import {
  calcularMelhorPlanoEquivalente,
  calcularSaidaEmNumeros,
  type SaidaEmNumerosResultado,
} from "@/lib/saida-em-numeros";
import { lerModulosAtivos } from "@/lib/modulos";
import { RetiradasTable } from "@/components/retiradas/retiradas-table";
import { NovaRetiradaButton } from "@/components/retiradas/nova-retirada-button";
import { RetiradaIdealCard } from "@/components/retiradas/retirada-ideal-card";
import { MeuCustoDeVidaBloco } from "@/components/retiradas/meu-custo-de-vida-bloco";
import { DiagnosticoRendaCard } from "@/components/retiradas/diagnostico-renda-card";
import { exigirSessaoAba } from "@/lib/permissoes";
import { runWithTenant, type TenantContext } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function RetiradasPage() {
  const sessao = await exigirSessaoAba("retiradas");
  return runWithTenant(sessao, () => RetiradasPageConteudo(sessao));
}

async function RetiradasPageConteudo(sessao: TenantContext) {
  const somenteLeituraRetiradas = sessao.papel === "consultor";
  const podeAjustarConfig = sessao.papel !== "membro";
  const souDono = sessao.papel === "dono";

  const hoje = new Date();
  const mes = mesAtual(hoje);

  const [retiradas, clinica, donos] = await Promise.all([
    prisma.retirada.findMany({ orderBy: { data: "desc" } }),
    prisma.clinica.findUniqueOrThrow({ where: { id: sessao.clinicaId } }),
    prisma.usuario.findMany({
      where: { clinicaId: sessao.clinicaId, papel: "dono" },
      orderBy: { createdAt: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const [estadoSaudavel, caixaLivreResultado] = await Promise.all([
    calcularRetiradaSaudavel(clinica.percentualReservaRetirada, clinica.proLaboreCombinado, hoje),
    calcularCaixaLivre(clinica.horizonteDiasCompromissos, clinica.reservaMesesCustoFixo, hoje),
  ]);
  const retiradaIdealResultado = calcularRetiradaIdeal(estadoSaudavel, caixaLivreResultado);
  const retiradaIdealTotal = retiradaIdealResultado.estado === "calculado" ? retiradaIdealResultado.retiradaIdeal : 0;

  const totalMes = calcularTotalRetiradoNoMes(retiradas, mes);
  const totalUltimos3Meses = calcularTotalRetiradoUltimos3Meses(retiradas);

  const { inicio, fim } = limitesDoMes(mes);
  const retiradasDoMes = retiradas.filter(
    (r) => r.data.getTime() >= inicio.getTime() && r.data.getTime() < fim.getTime(),
  );
  const destacadas =
    retiradaIdealResultado.estado === "sem_dado"
      ? new Set<string>()
      : marcarRetiradasAcimaDoRecomendado(retiradasDoMes, retiradaIdealTotal);

  const nomePorDonoId = new Map(donos.map((dono) => [dono.id, dono.nome]));

  // ---------- Parte 2/4/5: só o dono vê custo de vida, diagnóstico e saída em números ----------
  let meuCustoDeVida = null;
  let minhaRetiradaMes = 0;
  let diagnosticoSecao = null;

  if (souDono) {
    const [meuCustoDeVidaDados, somaCustoDeVida, mediaFinanceira] = await Promise.all([
      buscarMeuCustoDeVida(),
      buscarSomaCustoDeVidaAtivo(sessao.clinicaId),
      calcularMediaFinanceira3Meses(hoje),
    ]);

    meuCustoDeVida = meuCustoDeVidaDados;
    minhaRetiradaMes = calcularTotalRetiradoNoMes(
      retiradas.filter((r) => r.usuarioId === sessao.usuarioId),
      mes,
    );

    const clinicaSaudavel =
      mediaFinanceira !== null &&
      mediaFinanceira.sobraMedia > LIMITE_SOBRA_MEDIA_SAUDAVEL &&
      caixaLivreResultado.caixaLivre >= 0;

    const diagnostico = calcularDiagnosticoRenda(
      retiradaIdealTotal,
      somaCustoDeVida.somaPreciso,
      somaCustoDeVida.somaQuero,
      clinicaSaudavel,
    );

    if (diagnostico.tipo === "com_custo_de_vida") {
      const modulosAtivos = lerModulosAtivos(clinica.modulosAtivos);

      const [produtos, consultorAcesso, planoModelos] = await Promise.all([
        prisma.produto.findMany({
          select: {
            nome: true,
            precoVenda: true,
            custoMedioMaterial: true,
            duracaoMinutos: true,
            comissaoTipo: true,
            comissaoValor: true,
            perfilTributario: { select: { aliquota: true } },
          },
        }),
        prisma.consultorAcesso.findFirst({
          where: { clinicaId: sessao.clinicaId },
          orderBy: { dataAcesso: "desc" },
          select: { usuario: { select: { nome: true, email: true } } },
        }),
        modulosAtivos.planos
          ? prisma.planoModelo.findMany({
              select: {
                nome: true,
                itens: {
                  select: {
                    valorItem: true,
                    produto: {
                      select: {
                        custoMedioMaterial: true,
                        comissaoTipo: true,
                        comissaoValor: true,
                        perfilTributario: { select: { aliquota: true } },
                      },
                    },
                  },
                },
              },
            })
          : Promise.resolve([]),
      ]);

      const produtosComMargem = produtos.map((produto) => {
        const margem = calcularMargemContribuicao(produto);
        return { nome: produto.nome, margemReais: margem.margemReais, precoTotal: margem.precoTotal };
      });

      const faltaPreciso = somaCustoDeVida.somaPreciso - retiradaIdealTotal;
      const faltaQuero = somaCustoDeVida.somaQuero - retiradaIdealTotal;

      function montarSaida(falta: number): SaidaEmNumerosResultado | null {
        if (falta <= 0) return null;
        let resultado = calcularSaidaEmNumeros(falta, clinica.percentualReservaRetirada, produtosComMargem);
        if (resultado.tipo === "calculado") {
          const planoEquivalente = calcularMelhorPlanoEquivalente(resultado.resultadoExtraNecessario, planoModelos);
          resultado = { ...resultado, planoEquivalente };
        }
        return resultado;
      }

      diagnosticoSecao = {
        diagnostico,
        maiorPeso: mediaFinanceira?.maiorPeso ?? null,
        consultorContato: consultorAcesso
          ? { nome: consultorAcesso.usuario.nome, email: consultorAcesso.usuario.email }
          : null,
        somaPreciso: somaCustoDeVida.somaPreciso,
        somaQuero: somaCustoDeVida.somaQuero,
        saidaPreciso: montarSaida(faltaPreciso),
        saidaQuero: montarSaida(faltaQuero),
      };
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Retiradas</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Quanto você pode retirar e o que isso significa para a sua renda.
          </p>
        </div>
        {!somenteLeituraRetiradas && (
          <NovaRetiradaButton donos={donos} donoAtualId={souDono ? sessao.usuarioId : null} />
        )}
      </header>

      <RetiradaIdealCard
        resultado={retiradaIdealResultado}
        estadoSaudavel={estadoSaudavel}
        totalRetiradoMes={totalMes}
        percentualAtual={clinica.percentualReservaRetirada}
        proLaboreAtual={clinica.proLaboreCombinado}
        horizonteAtual={clinica.horizonteDiasCompromissos}
        reservaAtual={clinica.reservaMesesCustoFixo}
        podeAjustarConfig={podeAjustarConfig}
        podeAjustarCalculo={souDono}
      />

      {souDono && <MeuCustoDeVidaBloco dados={meuCustoDeVida} minhaRetiradaMes={minhaRetiradaMes} />}

      {souDono && diagnosticoSecao && (
        <DiagnosticoRendaCard
          diagnostico={diagnosticoSecao.diagnostico}
          maiorPeso={diagnosticoSecao.maiorPeso}
          consultorContato={diagnosticoSecao.consultorContato}
          somaPreciso={diagnosticoSecao.somaPreciso}
          somaQuero={diagnosticoSecao.somaQuero}
          retiradaIdealTotal={retiradaIdealTotal}
          saidaPreciso={diagnosticoSecao.saidaPreciso}
          saidaQuero={diagnosticoSecao.saidaQuero}
        />
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Total retirado no mês
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(totalMes)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Total retirado nos últimos 3 meses
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(totalUltimos3Meses)}
          </p>
        </div>
      </div>

      <RetiradasTable retiradas={retiradas} destacadas={destacadas} nomePorDonoId={nomePorDonoId} />
    </main>
  );
}
