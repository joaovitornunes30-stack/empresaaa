import { prisma } from "@/lib/prisma";
import { limitesDoMes } from "@/lib/financeiro";
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

/** Os 3 meses ("YYYY-MM") imediatamente anteriores ao mês de `hoje`, do mais antigo ao mais recente — nunca inclui o mês atual (incompleto). */
function tresMesesAnteriores(hoje: Date): string[] {
  const meses: string[] = [];
  for (let i = 3; i >= 1; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`);
  }
  return meses;
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
 * - "com_historico" quando os 3 meses anteriores ao atual têm movimentação
 *   registrada (3 meses fechados): retiradaMaxima = max(0, sobraMedia dos
 *   3 meses), retiradaSaudavel = retiradaMaxima * (1 - reserva%).
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
  const planosParaResumo = await prisma.plano.findMany({ select: SELECT_PLANOS_PARA_RESUMO });

  const porMes = await Promise.all(
    tresMesesAnteriores(hoje).map((mes) => calcularOQueRealmenteSobrouDoMes(mes, planosParaResumo)),
  );

  const fatorReserva = 1 - percentualReservaRetirada / 100;
  const temTresMesesFechados = porMes.every((m) => m.temDados);

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
