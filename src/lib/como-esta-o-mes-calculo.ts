import { prisma } from "@/lib/prisma";
import { limitesDoMes, mesAtual } from "@/lib/financeiro";
import { calcularCaixaMes, calcularMetaDoMes, calcularVendasMes } from "@/lib/analise";
import { calcularReceitaReconhecidaMes, type PlanoParaResumo } from "@/lib/planos";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";
import { calcularCaixaLivre } from "@/lib/caixa-livre-calculo";
import {
  calcularRetiradaIdeal,
  calcularSemaforoRetiradaIdeal,
  type EstadoSemaforoIdeal,
  type RetiradaIdealResultado,
} from "@/lib/caixa-livre";
import { calcularTotalRetiradoNoMes, type EstadoRetiradaSaudavel } from "@/lib/retiradas";

export type ComoEstaOMes = {
  meta: { valorMeta: number; vendasMes: number; percentual: number; atingiu: boolean; faltante: number } | null;
  receitaReconhecidaMes: number;
  caixaMes: number;
  retiradaIdeal: RetiradaIdealResultado;
  estadoSaudavel: EstadoRetiradaSaudavel;
  totalRetiradoMes: number;
  semaforoIdeal: EstadoSemaforoIdeal;
};

/**
 * Os 4 números do bloco "Como está o mês" da Home (Correção da Home, item
 * 1) — todos recalculados com as MESMAS funções puras usadas em Análise e
 * Retiradas, nunca uma conta paralela. Os valores aqui são sempre idênticos
 * aos das abas de origem para o mesmo instante.
 */
export async function calcularComoEstaOMes(
  clinica: {
    percentualReservaRetirada: number;
    proLaboreCombinado: number | null;
    horizonteDiasCompromissos: number;
    reservaMesesCustoFixo: number;
  },
  hoje: Date = new Date(),
): Promise<ComoEstaOMes> {
  const mes = mesAtual(hoje);
  const { inicio, fim } = limitesDoMes(mes);

  const [metaDoMes, entradasSaidasDoMes, planosParaResumo, parcelasPagasVendasDoMes, retiradasDoMes, caixaLivreResultado] =
    await Promise.all([
      prisma.metaDoMes.findFirst({ where: { mesReferencia: mes } }),
      prisma.entradaSaida.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { tipo: true, categoria: true, valor: true } }),
      prisma.plano.findMany({
        select: {
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
              sessoes: { select: { status: true, dataEntregue: true, dataPrevista: true } },
            },
          },
        },
      }),
      prisma.parcela.findMany({
        where: { status: "pago", dataVencimento: { gte: inicio, lt: fim }, entradaSaida: { tipo: "entrada" } },
        select: { valor: true },
      }),
      prisma.retirada.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { valor: true, data: true } }),
      calcularCaixaLivre(clinica.horizonteDiasCompromissos, clinica.reservaMesesCustoFixo, hoje),
    ]);

  const vendasMes = calcularVendasMes(entradasSaidasDoMes);
  const meta = metaDoMes
    ? { valorMeta: metaDoMes.valorMeta, vendasMes, ...calcularMetaDoMes(vendasMes, metaDoMes.valorMeta, hoje) }
    : null;

  const receitaReconhecidaMes = calcularReceitaReconhecidaMes(planosParaResumo as PlanoParaResumo[], mes);
  const caixaMes = calcularCaixaMes(parcelasPagasVendasDoMes);

  const estadoSaudavel = await calcularRetiradaSaudavel(clinica.percentualReservaRetirada, clinica.proLaboreCombinado, hoje);
  const retiradaIdeal = calcularRetiradaIdeal(estadoSaudavel, caixaLivreResultado);
  const totalRetiradoMes = calcularTotalRetiradoNoMes(retiradasDoMes, mes);
  const semaforoIdeal = calcularSemaforoRetiradaIdeal(retiradaIdeal, estadoSaudavel, totalRetiradoMes);

  return { meta, receitaReconhecidaMes, caixaMes, retiradaIdeal, estadoSaudavel, totalRetiradoMes, semaforoIdeal };
}
