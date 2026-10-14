import { prisma } from "@/lib/prisma";
import { limitesDoMes, mesAnterior, mesAtual } from "@/lib/financeiro";
import { buscarMesesPausados } from "@/lib/meses-pausados";
import {
  calcularCustosFixosMes,
  calcularCustoVendasSimplesMes,
  calcularParaOndeVaiDinheiro,
  calcularParcelasDividaPagasMes,
  calcularReceitaVendasSimplesMes,
  filtrarVendasSimplesDoMes,
} from "@/lib/analise";
import {
  calcularCustoMes,
  calcularReceitaReconhecidaMes,
  type PlanoParaResumo,
} from "@/lib/planos";
import type { EstadoRetiradaSaudavel } from "@/lib/retiradas";

// Depois de olhar para trás esse número de meses sem achar 3 não-pausados,
// desiste — evita um loop praticamente sem fim se quase todo o histórico da
// clínica estiver pausado.
const LIMITE_MESES_PARA_TRAS = 24;

/**
 * Os 3 meses ("YYYY-MM") fechados mais recentes antes do mês de `hoje`, do
 * mais antigo ao mais recente — nunca inclui o mês atual (incompleto).
 * Qualquer mês pausado (ver lib/meses-pausados.ts) é pulado e substituído
 * pelo mês fechado anterior, exatamente como pedido na funcionalidade
 * "Pausar um mês": o mês pausado não some dos lançamentos, só sai da
 * média. Se não achar 3 meses não-pausados dentro do limite de busca,
 * retorna o que achou (nunca 3) — o chamador trata isso como "sem
 * histórico suficiente", igual a antes.
 */
function tresMesesFechadosNaoPausados(hoje: Date, mesesPausados: Set<string>): string[] {
  const meses: string[] = [];
  let cursor = mesAnterior(mesAtual(hoje));
  for (let passos = 0; meses.length < 3 && passos < LIMITE_MESES_PARA_TRAS; passos++) {
    if (!mesesPausados.has(cursor)) meses.push(cursor);
    cursor = mesAnterior(cursor);
  }
  return meses.reverse();
}

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
 * "O que realmente sobrou" de um mês específico — mesmo cálculo do card
 * "Para Onde Vai o Dinheiro" da Análise (calcularParaOndeVaiDinheiro),
 * reaproveitado aqui para um mês qualquer em vez de só o mês atual.
 * `temDados` marca se houve alguma movimentação financeira no mês — é o
 * que decide se ele conta como "mês fechado" para a média.
 */
async function calcularOQueRealmenteSobrouDoMes(mes: string, planosParaResumo: PlanoParaResumo[]) {
  const { inicio, fim } = limitesDoMes(mes);

  const [entradasSaidasDoMes, parcelasPagasDividaDoMes] = await Promise.all([
    prisma.entradaSaida.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: {
        tipo: true,
        categoria: true,
        valor: true,
        produtoId: true,
        produto: {
          select: {
            id: true,
            nome: true,
            custoMedioMaterial: true,
            comissaoTipo: true,
            comissaoValor: true,
            perfilTributario: { select: { aliquota: true } },
          },
        },
      },
    }),
    prisma.parcela.findMany({
      where: {
        status: "pago",
        dataVencimento: { gte: inicio, lt: fim },
        entradaSaida: { tipo: "saida", dividaId: { not: null } },
      },
      select: { valor: true },
    }),
  ]);

  const vendasSimplesDoMes = filtrarVendasSimplesDoMes(entradasSaidasDoMes);

  const oQueRealmenteSobrou = calcularParaOndeVaiDinheiro({
    receitaVendasSimplesMes: calcularReceitaVendasSimplesMes(vendasSimplesDoMes),
    receitaReconhecidaMes: calcularReceitaReconhecidaMes(planosParaResumo, mes),
    custoVendasSimplesMes: calcularCustoVendasSimplesMes(vendasSimplesDoMes),
    custoSessoesPlanosMes: calcularCustoMes(planosParaResumo, mes),
    custosFixosMes: calcularCustosFixosMes(entradasSaidasDoMes),
    parcelasDividaPagasMes: calcularParcelasDividaPagasMes(parcelasPagasDividaDoMes),
  }).oQueRealmenteSobrou;

  return { temDados: entradasSaidasDoMes.length > 0, oQueRealmenteSobrou };
}

/**
 * Estado da retirada saudável da clínica no mês de `hoje`:
 *
 * - "com_historico" quando os 3 meses fechados não-pausados mais recentes
 *   têm movimentação registrada: retiradaMaxima = max(0, sobraMedia dos
 *   3 meses), retiradaSaudavel = retiradaMaxima * (1 - reserva%). Um mês
 *   pausado (ver lib/meses-pausados.ts) nunca entra nessa média — é pulado
 *   e substituído pelo mês fechado anterior.
 * - "sem_historico_com_prolabore" quando falta histórico mas há um
 *   pró-labore combinado: ele vira a própria retiradaSaudavel de
 *   referência, com a máxima derivada da mesma reserva%.
 * - "sem_historico_sem_prolabore" quando não há nem histórico nem
 *   pró-labore combinado — nunca inventa um valor.
 */
export async function calcularRetiradaSaudavel(
  percentualReservaRetirada: number,
  proLaboreCombinado: number | null,
  hoje: Date = new Date(),
): Promise<EstadoRetiradaSaudavel> {
  const [planosParaResumo, mesesPausados] = await Promise.all([
    prisma.plano.findMany({ select: SELECT_PLANOS_PARA_RESUMO }),
    buscarMesesPausados(),
  ]);

  const meses = tresMesesFechadosNaoPausados(hoje, new Set(mesesPausados.keys()));
  const porMes =
    meses.length === 3
      ? await Promise.all(meses.map((mes) => calcularOQueRealmenteSobrouDoMes(mes, planosParaResumo)))
      : [];

  const fatorReserva = 1 - percentualReservaRetirada / 100;
  const temTresMesesFechados = meses.length === 3 && porMes.every((m) => m.temDados);

  if (temTresMesesFechados) {
    const sobraMedia = porMes.reduce((total, m) => total + m.oQueRealmenteSobrou, 0) / porMes.length;
    const retiradaMaxima = Math.max(0, sobraMedia);
    return {
      estado: "com_historico",
      retiradaSaudavel: retiradaMaxima * fatorReserva,
      retiradaMaxima,
      sobraMedia,
      proLaboreCombinado,
    };
  }

  if (proLaboreCombinado !== null && proLaboreCombinado > 0) {
    return {
      estado: "sem_historico_com_prolabore",
      retiradaSaudavel: proLaboreCombinado,
      retiradaMaxima: fatorReserva > 0 ? proLaboreCombinado / fatorReserva : proLaboreCombinado,
    };
  }

  return { estado: "sem_historico_sem_prolabore" };
}
