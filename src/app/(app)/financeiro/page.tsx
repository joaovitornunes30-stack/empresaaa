import { prisma } from "@/lib/prisma";
import {
  agruparDividasPorPrazo,
  calcularProjecaoCaixa,
  calcularSaldoAtual,
  limitesDoMes,
  mesAtual,
} from "@/lib/financeiro";
import { sincronizarLancamentosRecorrentes } from "@/lib/folha";
import { ResumoDividas } from "@/components/financeiro/resumo-dividas";
import { ProjecaoCaixa } from "@/components/financeiro/projecao-caixa";
import { EntradasSaidasTable } from "@/components/financeiro/entradas-saidas-table";
import { NovaEntradaSaidaButton } from "@/components/financeiro/nova-entrada-saida-button";
import { DividasManager } from "@/components/financeiro/dividas-manager";
import { TodasDividasTable } from "@/components/financeiro/todas-dividas-table";
import { FuncionariosManager } from "@/components/financeiro/funcionarios-manager";
import { DespesasAdministrativasManager } from "@/components/financeiro/despesas-administrativas-manager";
import { exigirSessaoAba } from "@/lib/permissoes";
import { runWithTenant } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage(props: PageProps<"/financeiro">) {
  const sessao = await exigirSessaoAba("financeiro");
  const searchParams = await props.searchParams;
  return runWithTenant(sessao, () =>
    FinanceiroPageConteudo(searchParams, sessao.papel === "consultor", sessao.clinicaId),
  );
}

async function FinanceiroPageConteudo(
  searchParams: Awaited<PageProps<"/financeiro">["searchParams"]>,
  somenteLeitura: boolean,
  clinicaId: string,
) {
  const mesParam = searchParams.mes;
  const mes = typeof mesParam === "string" && mesParam ? mesParam : mesAtual();
  const { inicio, fim } = limitesDoMes(mes);

  if (!somenteLeitura) await sincronizarLancamentosRecorrentes();

  const [
    dividas,
    todasEntradasSaidas,
    parcelasPendentes,
    entradasSaidasDoMes,
    metaLucro,
    produtos,
    funcionarios,
    despesasAdministrativas,
    usuariosDisponiveis,
  ] = await Promise.all([
    prisma.divida.findMany({
      orderBy: { createdAt: "desc" },
      include: { entradasSaida: { include: { parcelas: true } } },
    }),
    prisma.entradaSaida.findMany({ select: { tipo: true, valor: true } }),
    prisma.parcela.findMany({
      where: { status: "pendente" },
      include: { entradaSaida: { select: { tipo: true } } },
    }),
    prisma.entradaSaida.findMany({
      where: { data: { gte: inicio, lt: fim } },
      include: { parcelas: true },
      orderBy: { data: "desc" },
    }),
    prisma.metaLucroMensal.findFirst({ where: { mes } }),
    prisma.produto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.funcionario.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.despesaAdministrativa.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.usuario.findMany({
      where: { clinicaId, ativo: true },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const totaisPorPrazo = agruparDividasPorPrazo(dividas);
  const saldoAtual = calcularSaldoAtual(todasEntradasSaidas);
  const projecoes = calcularProjecaoCaixa(parcelasPendentes, saldoAtual);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Financeiro
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Acompanhe entradas, saídas, dívidas e a projeção de caixa da
            clínica.
          </p>
        </div>
        {!somenteLeitura && (
          <div className="flex flex-wrap items-center gap-3">
            <FuncionariosManager
              funcionarios={funcionarios}
              usuariosDisponiveis={usuariosDisponiveis}
            />
            <DespesasAdministrativasManager despesas={despesasAdministrativas} />
            <DividasManager dividas={dividas} />
            <NovaEntradaSaidaButton produtos={produtos} />
          </div>
        )}
      </header>

      <div className="mb-8">
        <EntradasSaidasTable
          itens={entradasSaidasDoMes}
          mes={mes}
          meta={metaLucro?.valor ?? null}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Projeção de caixa
        </h2>
        <ProjecaoCaixa saldoAtual={saldoAtual} projecoes={projecoes} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Dívidas por prazo
        </h2>
        <ResumoDividas totais={totaisPorPrazo} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Todas as Dívidas
        </h2>
        <TodasDividasTable dividas={dividas} />
      </div>
    </main>
  );
}
