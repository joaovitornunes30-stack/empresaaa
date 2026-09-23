import { prisma } from "@/lib/prisma";
import { agruparDividasPorPrazo, limitesDoMes, mesAtual } from "@/lib/financeiro";
import {
  calcularCaixaMes,
  calcularComparativoMensal,
  calcularComposicaoFaturamento,
  calcularEstoqueAtual,
  calcularFaturamentoMes,
  calcularGastoMidia,
  calcularHistoricoEstoque,
  calcularMetaDoMes,
  calcularVendasMes,
  gerarResumoDoMes,
  ultimosMeses,
} from "@/lib/analise";
import { MetaDoMesCard } from "@/components/analise/meta-do-mes-card";
import { FaturamentoVsCaixa } from "@/components/analise/faturamento-vs-caixa";
import { EstoqueSection, type EstoqueProduto } from "@/components/analise/estoque-section";
import { RegistrarMovimentoEstoqueButton } from "@/components/analise/registrar-movimento-estoque-button";
import { ComposicaoFaturamento } from "@/components/analise/composicao-faturamento";
import { GastoMidiaCard } from "@/components/analise/gasto-midia-card";
import { ResumoDividas } from "@/components/financeiro/resumo-dividas";
import { ComparativoMensalChart } from "@/components/analise/comparativo-mensal-chart";
import { ResumoDoMes } from "@/components/analise/resumo-do-mes";

export const dynamic = "force-dynamic";

export default async function AnalisePage() {
  const hoje = new Date();
  const mes = mesAtual(hoje);
  const { inicio, fim } = limitesDoMes(mes);
  const meses6 = ultimosMeses(6, hoje);
  const meses3 = ultimosMeses(3, hoje);
  const { inicio: inicioJanela6Meses } = limitesDoMes(meses6[0]);

  const [
    entradasSaidasDoMes,
    parcelasPagasVendasDoMes,
    dividas,
    produtos,
    movimentosEstoque,
    metaDoMes,
    entradasSaidasUltimos6Meses,
  ] = await Promise.all([
    prisma.entradaSaida.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: { tipo: true, categoria: true, valor: true, produtoId: true },
    }),
    prisma.parcela.findMany({
      where: {
        status: "pago",
        dataVencimento: { gte: inicio, lt: fim },
        entradaSaida: { tipo: "entrada" },
      },
      select: { valor: true },
    }),
    prisma.divida.findMany({
      include: { entradasSaida: { include: { parcelas: true } } },
    }),
    prisma.produto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.estoqueMovimento.findMany({
      select: { produtoId: true, tipo: true, quantidade: true, data: true },
    }),
    prisma.metaDoMes.findUnique({ where: { mesReferencia: mes } }),
    prisma.entradaSaida.findMany({
      where: { data: { gte: inicioJanela6Meses, lt: fim } },
      select: { tipo: true, valor: true, data: true },
    }),
  ]);

  const faturamentoMes = calcularFaturamentoMes(entradasSaidasDoMes);
  const vendasMes = calcularVendasMes(entradasSaidasDoMes);
  const caixaMes = calcularCaixaMes(parcelasPagasVendasDoMes);
  const gastoMidia = calcularGastoMidia(entradasSaidasDoMes);
  const totaisPorPrazo = agruparDividasPorPrazo(dividas);
  const composicao = calcularComposicaoFaturamento(entradasSaidasDoMes, produtos);
  const comparativo = calcularComparativoMensal(entradasSaidasUltimos6Meses, meses6);

  const estoquePorProduto: EstoqueProduto[] = produtos.map((produto) => {
    const movimentosDoProduto = movimentosEstoque.filter(
      (m) => m.produtoId === produto.id,
    );
    return {
      id: produto.id,
      nome: produto.nome,
      atual: calcularEstoqueAtual(movimentosDoProduto),
      historico: calcularHistoricoEstoque(movimentosDoProduto, meses3),
    };
  });

  const faturamentoMesAnterior =
    comparativo.length >= 2 ? comparativo[comparativo.length - 2].faturamento : 0;

  const resumo = gerarResumoDoMes({
    faturamentoMes,
    faturamentoMesAnterior,
    caixaMes,
    dividaCurtoPrazo: totaisPorPrazo.curto,
    gastoMidia,
    estoques: estoquePorProduto.map((produto) => ({
      nome: produto.nome,
      historico: produto.historico,
    })),
    meta: metaDoMes
      ? { valorMeta: metaDoMes.valorMeta, ...calcularMetaDoMes(vendasMes, metaDoMes.valorMeta, hoje) }
      : null,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Análise</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Painel consolidado do mês — dados reais, sem estimativas.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetaDoMesCard mes={mes} valorMeta={metaDoMes?.valorMeta ?? null} vendasMes={vendasMes} />
        <div className="lg:col-span-2">
          <FaturamentoVsCaixa faturamentoMes={faturamentoMes} caixaMes={caixaMes} />
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">
            Estoque
          </h2>
          <RegistrarMovimentoEstoqueButton produtos={produtos} />
        </div>
        <EstoqueSection produtos={estoquePorProduto} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-foreground">
            Composição do Faturamento
          </h2>
          <ComposicaoFaturamento fatias={composicao} />
        </div>
        <GastoMidiaCard gastoMidia={gastoMidia} faturamentoMes={faturamentoMes} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Dívidas por prazo
        </h2>
        <ResumoDividas totais={totaisPorPrazo} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Comparativo mês a mês
        </h2>
        <ComparativoMensalChart pontos={comparativo} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Resumo do mês
        </h2>
        <ResumoDoMes linhas={resumo} />
      </div>
    </main>
  );
}
