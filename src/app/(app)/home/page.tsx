import { prisma } from "@/lib/prisma";
import { exigirSessaoAba, temPermissaoAba } from "@/lib/permissoes";
import { runWithTenant, type TenantContext } from "@/lib/tenant-context";
import { calcularPassosConcluidos } from "@/lib/checklist-calculo";
import { montarChecklist, OBJETIVO_LABEL, type ObjetivoPrincipal } from "@/lib/checklist";
import { calcularItensAtencaoAtivos } from "@/lib/atencao-calculo";
import { ordenarItensAtencao, MAXIMO_ITENS_ATENCAO, type RotaAtencao } from "@/lib/atencao";
import { calcularComoEstaOMes } from "@/lib/como-esta-o-mes-calculo";
import { buscarNoticiasPublicadasParaClinica } from "@/lib/noticias-calculo";
import { ComecePorAquiBloco } from "@/components/home/comece-por-aqui-bloco";
import { PrecisaDeAtencaoLista } from "@/components/home/precisa-de-atencao-lista";
import { ComoEstaOMesCards } from "@/components/home/como-esta-o-mes-cards";
import { AtalhosRapidos } from "@/components/home/atalhos-rapidos";
import { NoticiaCard } from "@/components/noticias/noticia-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessao = await exigirSessaoAba("home");
  return runWithTenant(sessao, () => HomePageConteudo(sessao));
}

async function HomePageConteudo(sessao: TenantContext) {
  const clinica = await prisma.clinica.findUniqueOrThrow({ where: { id: sessao.clinicaId } });
  const souDono = sessao.papel === "dono";
  const souConsultor = sessao.papel === "consultor";
  const souMembro = sessao.papel === "membro";

  const objetivoPrincipal = clinica.objetivoPrincipal as ObjetivoPrincipal | null;

  const [podeAnalise, podeProdutos, podeClientes, podeFinanceiro, podeRetiradas] = await Promise.all([
    temPermissaoAba(sessao, "analise"),
    temPermissaoAba(sessao, "produtos"),
    temPermissaoAba(sessao, "clientes"),
    temPermissaoAba(sessao, "financeiro"),
    temPermissaoAba(sessao, "retiradas"),
  ]);
  const PERMISSAO_POR_ROTA: Record<RotaAtencao, boolean> = {
    analise: podeAnalise,
    produtos: podeProdutos,
    clientes: podeClientes,
    financeiro: podeFinanceiro,
    retiradas: podeRetiradas,
  };

  const [noticias, itensAtencaoAtivos, comoEstaOMes] = await Promise.all([
    buscarNoticiasPublicadasParaClinica(clinica.tipoClinica),
    calcularItensAtencaoAtivos(clinica),
    calcularComoEstaOMes(clinica),
  ]);

  let itensAtencao = ordenarItensAtencao(itensAtencaoAtivos, objetivoPrincipal);
  // "Membro vê os itens das áreas a que tem permissão" (Correção da Home,
  // item 3) — dono e consultor sempre veem a lista inteira.
  if (souMembro) {
    itensAtencao = itensAtencao.filter((item) => PERMISSAO_POR_ROTA[item.rota]);
  }
  itensAtencao = itensAtencao.slice(0, MAXIMO_ITENS_ATENCAO);

  let progresso = null;
  if (souDono) {
    const concluidos = await calcularPassosConcluidos(sessao.usuarioId, clinica.abriuMargemProduto);
    progresso = montarChecklist(objetivoPrincipal ?? "pular", concluidos);
  }

  // Atalhos rápidos: nunca para consultor (somente leitura). "Movimento de
  // Estoque" usa a mesma ação de Análise (registrarMovimentoEstoque é
  // comSessaoAba("analise", ...)), então segue a permissão de Análise, não
  // a de Produtos.
  const mostraAtalhos = !souConsultor && (podeFinanceiro || podeClientes || podeRetiradas || podeAnalise);
  const [produtos, clientes, donos] = await Promise.all([
    mostraAtalhos ? prisma.produto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }) : Promise.resolve([]),
    mostraAtalhos ? prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }) : Promise.resolve([]),
    mostraAtalhos
      ? prisma.usuario.findMany({ where: { clinicaId: sessao.clinicaId, papel: "dono" }, orderBy: { createdAt: "asc" }, select: { id: true, nome: true } })
      : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex items-center gap-4">
        {clinica.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinica.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Olá, {sessao.nome.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-foreground/60">{clinica.nome}</p>
        </div>
      </header>

      {souConsultor && objetivoPrincipal && (
        <p className="mb-6 text-sm text-foreground/60">
          <span className="font-medium text-foreground/80">Objetivo da clínica:</span> {OBJETIVO_LABEL[objetivoPrincipal]}
        </p>
      )}

      <ComoEstaOMesCards
        dados={comoEstaOMes}
        podeVerAnalise={podeAnalise}
        podeVerFinanceiro={podeFinanceiro}
        podeVerRetiradas={podeRetiradas}
      />

      {mostraAtalhos && (
        <AtalhosRapidos
          podeFinanceiro={podeFinanceiro}
          podeClientes={podeClientes}
          podeRetiradas={podeRetiradas}
          podeMovimentoEstoque={podeAnalise}
          produtos={produtos}
          clientes={clientes}
          donos={donos}
          donoAtualId={souDono ? sessao.usuarioId : null}
        />
      )}

      {souDono && progresso && (
        <ComecePorAquiBloco
          objetivoPrincipal={objetivoPrincipal}
          objetivoTexto={clinica.objetivoTexto}
          checklistDispensada={clinica.checklistDispensada}
          progresso={progresso}
        />
      )}

      <PrecisaDeAtencaoLista itens={itensAtencao} />

      {noticias.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Para ler</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {noticias.slice(0, 3).map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} compacta />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
