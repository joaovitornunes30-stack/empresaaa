import { prisma } from "@/lib/prisma";
import { diasAte, limitesDoMes, mesAtual } from "@/lib/financeiro";
import { calcularMetaDoMes, calcularVendasMes } from "@/lib/analise";
import { calcularMargemContribuicao } from "@/lib/calculos";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";
import { calcularCaixaLivre } from "@/lib/caixa-livre-calculo";
import { calcularRetiradaIdeal, calcularSemaforoRetiradaIdeal } from "@/lib/caixa-livre";
import { calcularTotalRetiradoNoMes } from "@/lib/retiradas";
import type { ItemAtencao } from "@/lib/atencao";

const HORIZONTE_VENCIMENTO_DIAS = 7;

/**
 * Lista de itens de atenção ATIVOS no momento (o chamador aplica
 * ordenarItensAtencao de lib/atencao.ts por cima, com o objetivo da
 * clínica). Reaproveita cálculos já existentes (Retirada ideal, meta do
 * mês, margem de contribuição) — nenhum dado novo é consultado.
 */
export async function calcularItensAtencaoAtivos(
  clinica: { percentualReservaRetirada: number; proLaboreCombinado: number | null; horizonteDiasCompromissos: number; reservaMesesCustoFixo: number },
  hoje: Date = new Date(),
): Promise<ItemAtencao[]> {
  const mes = mesAtual(hoje);
  const { inicio, fim } = limitesDoMes(mes);

  const [
    parcelasPendentes,
    retiradasDoMes,
    produtos,
    metaDoMes,
    entradasSaidasDoMes,
    estoqueMovimentos,
    caixaLivreResultado,
  ] = await Promise.all([
    prisma.parcela.findMany({ where: { status: "pendente" }, select: { dataVencimento: true } }),
    prisma.retirada.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { valor: true, data: true } }),
    prisma.produto.findMany({
      select: {
        precoVenda: true,
        custoMedioMaterial: true,
        duracaoMinutos: true,
        comissaoTipo: true,
        comissaoValor: true,
        perfilTributario: { select: { aliquota: true } },
      },
    }),
    prisma.metaDoMes.findFirst({ where: { mesReferencia: mes } }),
    prisma.entradaSaida.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { tipo: true, categoria: true, valor: true } }),
    prisma.estoqueMovimento.findMany({ select: { produtoId: true, tipo: true, quantidade: true } }),
    calcularCaixaLivre(clinica.horizonteDiasCompromissos, clinica.reservaMesesCustoFixo, hoje),
  ]);

  const itens: ItemAtencao[] = [];

  // ---------- Fixos — sempre no topo ----------
  if (caixaLivreResultado.caixaLivre < 0) {
    itens.push({ id: "caixa_negativo", texto: "O caixa livre está negativo.", objetivoRelacionado: null });
  }

  const temVencimentoProximo = parcelasPendentes.some((p) => {
    const dias = diasAte(p.dataVencimento, hoje);
    return dias >= 0 && dias <= HORIZONTE_VENCIMENTO_DIAS;
  });
  if (temVencimentoProximo) {
    itens.push({
      id: "vencimentos_proximos",
      texto: "Há parcelas vencendo nos próximos 7 dias.",
      objetivoRelacionado: null,
    });
  }

  // ---------- Ligados a objetivo — ordem padrão fixa ----------
  const estadoSaudavel = await calcularRetiradaSaudavel(clinica.percentualReservaRetirada, clinica.proLaboreCombinado, hoje);
  const resultadoIdeal = calcularRetiradaIdeal(estadoSaudavel, caixaLivreResultado);
  const totalRetiradoMes = calcularTotalRetiradoNoMes(retiradasDoMes, mes);
  const semaforoIdeal = calcularSemaforoRetiradaIdeal(resultadoIdeal, estadoSaudavel, totalRetiradoMes);
  if (semaforoIdeal === "vermelho" && totalRetiradoMes > 0) {
    itens.push({
      id: "retirada_acima_recomendado",
      texto: "A retirada deste mês está acima do recomendado.",
      objetivoRelacionado: "quanto_retirar",
    });
  }

  if (produtos.length > 0 && produtos.every((produto) => calcularMargemContribuicao(produto).margemReais <= 0)) {
    itens.push({
      id: "nenhum_produto_com_margem",
      texto: "Nenhum produto cadastrado está com margem positiva.",
      objetivoRelacionado: "precificar",
    });
  }

  if (metaDoMes) {
    const vendasMes = calcularVendasMes(entradasSaidasDoMes);
    const metaInfo = calcularMetaDoMes(vendasMes, metaDoMes.valorMeta, hoje);
    if (metaInfo.percentual < 50 && metaInfo.diasRestantes < 10) {
      itens.push({
        id: "meta_abaixo_50_poucos_dias",
        texto: "Meta do mês abaixo de 50%, com poucos dias restantes.",
        objetivoRelacionado: "vender_reter",
      });
    }
  }

  const saldoPorProduto = new Map<string, number>();
  estoqueMovimentos.forEach((mov) => {
    const atual = saldoPorProduto.get(mov.produtoId) ?? 0;
    saldoPorProduto.set(mov.produtoId, atual + (mov.tipo === "entrada" ? mov.quantidade : -mov.quantidade));
  });
  const temEstoqueZerado = Array.from(saldoPorProduto.values()).some((quantidade) => quantidade <= 0);
  if (temEstoqueZerado) {
    itens.push({
      id: "estoque_zerado",
      texto: "Algum produto está com o estoque zerado ou negativo.",
      objetivoRelacionado: "estoque",
    });
  }

  return itens;
}
