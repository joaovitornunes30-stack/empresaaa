import { prisma } from "@/lib/prisma";
import { buscarMesesPausados } from "@/lib/meses-pausados";
import { calcularOQueRealmenteSobrouDoMes, tresMesesFechadosNaoPausados } from "@/lib/retiradas-calculo";
import type { MediaFinanceira3Meses, PesoFinanceiro } from "@/lib/diagnostico-renda";

const SELECT_PLANOS_PARA_RESUMO = {
  itens: {
    select: {
      valorItem: true,
      quantidadeSessoes: true,
      produto: {
        select: {
          custoMedioMaterial: true,
          comissaoTipo: true,
          comissaoValor: true,
          perfilTributario: { select: { aliquota: true } },
        },
      },
      sessoes: { select: { status: true, dataEntregue: true } },
    },
  },
} as const;

/**
 * Média dos 3 meses fechados não-pausados mais recentes, reaproveitando o
 * mesmo cálculo de "O que realmente sobrou" usado na retirada saudável —
 * `null` quando ainda não há esse histórico. `maiorPeso` aponta qual das
 * três saídas (dívida, custo fixo ou custo do que foi vendido/margem) mais
 * pesa na média, para o diagnóstico "o foco hoje é a clínica".
 */
export async function calcularMediaFinanceira3Meses(hoje: Date = new Date()): Promise<MediaFinanceira3Meses> {
  const [planosParaResumo, mesesPausados] = await Promise.all([
    prisma.plano.findMany({ select: SELECT_PLANOS_PARA_RESUMO }),
    buscarMesesPausados(),
  ]);

  const meses = tresMesesFechadosNaoPausados(hoje, new Set(mesesPausados.keys()));
  if (meses.length < 3) return null;

  const porMes = await Promise.all(meses.map((mes) => calcularOQueRealmenteSobrouDoMes(mes, planosParaResumo)));
  if (!porMes.every((m) => m.temDados)) return null;

  const media = (chave: "oQueRealmenteSobrou" | "custosFixosMes" | "parcelasDividaPagasMes" | "custoVendidoMes") =>
    porMes.reduce((total, m) => total + m[chave], 0) / porMes.length;

  const sobraMedia = media("oQueRealmenteSobrou");
  const custosFixosMedia = media("custosFixosMes");
  const parcelasDividaMedia = media("parcelasDividaPagasMes");
  const custoVendidoMedia = media("custoVendidoMes");

  const pesos: { peso: PesoFinanceiro; valor: number }[] = [
    { peso: "divida", valor: parcelasDividaMedia },
    { peso: "custoFixo", valor: custosFixosMedia },
    { peso: "margem", valor: custoVendidoMedia },
  ];
  const maior = pesos.reduce((a, b) => (b.valor > a.valor ? b : a));
  // Nada de fato pesando (tudo zerado) — não aponta nenhum como "o maior".
  const maiorPeso = maior.valor > 0 ? maior.peso : null;

  return { sobraMedia, custosFixosMedia, parcelasDividaMedia, custoVendidoMedia, maiorPeso };
}
