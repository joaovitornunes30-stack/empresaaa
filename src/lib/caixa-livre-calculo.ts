import { prisma } from "@/lib/prisma";
import { adicionarDias, calcularSaldoAtual, diasAte, limitesDoMes } from "@/lib/financeiro";
import { calcularCustosFixosMes } from "@/lib/analise";
import { gerarPeriodosDespesaRecorrente, gerarPeriodosFuncionario } from "@/lib/folha";
import { buscarMesesPausados } from "@/lib/meses-pausados";
import { tresMesesFechadosNaoPausados } from "@/lib/retiradas-calculo";
import type { ResultadoCaixaLivre } from "@/lib/caixa-livre";

/**
 * Soma das saídas já programadas dentro dos próximos `horizonteDias`:
 * parcelas de dívida pendentes (já existem no banco, geradas na ativação
 * da dívida), salário de cada Funcionario ativo e cada ocorrência futura
 * de DespesaAdministrativa recorrente ativa (projetadas reaproveitando as
 * mesmas funções de recorrência de lib/folha.ts — nunca duplicadas).
 */
export async function calcularSaidasProgramadas(
  horizonteDias: number,
  hoje: Date = new Date(),
): Promise<number> {
  const fimHorizonte = adicionarDias(hoje, horizonteDias);

  const [parcelasPendentes, funcionariosAtivos, despesasRecorrentesAtivas] = await Promise.all([
    prisma.parcela.findMany({
      where: { status: "pendente", entradaSaida: { tipo: "saida" } },
      select: { valor: true, dataVencimento: true },
    }),
    prisma.funcionario.findMany({ where: { ativo: true }, select: { valorMensal: true, createdAt: true } }),
    prisma.despesaAdministrativa.findMany({
      where: { ativo: true, recorrente: true },
      select: { valor: true, frequencia: true, dataInicio: true },
    }),
  ]);

  const parcelasNoHorizonte = parcelasPendentes
    .filter((parcela) => {
      const dias = diasAte(parcela.dataVencimento, hoje);
      return dias >= 0 && dias <= horizonteDias;
    })
    .reduce((total, parcela) => total + parcela.valor, 0);

  const salariosNoHorizonte = funcionariosAtivos.reduce((total, funcionario) => {
    const ocorrencias = gerarPeriodosFuncionario(funcionario.createdAt, fimHorizonte).filter(
      (data) => diasAte(data, hoje) > 0,
    ).length;
    return total + ocorrencias * funcionario.valorMensal;
  }, 0);

  const despesasNoHorizonte = despesasRecorrentesAtivas.reduce((total, despesa) => {
    if (!despesa.frequencia || !despesa.dataInicio) return total;
    const ocorrencias = gerarPeriodosDespesaRecorrente(despesa.dataInicio, despesa.frequencia, fimHorizonte).filter(
      (data) => diasAte(data, hoje) > 0,
    ).length;
    return total + ocorrencias * despesa.valor;
  }, 0);

  return parcelasNoHorizonte + salariosNoHorizonte + despesasNoHorizonte;
}

const SELECT_ENTRADAS_SAIDAS_CUSTO_FIXO = { tipo: true, categoria: true, valor: true } as const;

/**
 * Custo fixo médio dos mesmos 3 meses fechados não-pausados usados na
 * retirada saudável — `null` quando ainda não há esse histórico (nunca
 * inventa uma reserva mínima sem dado real por trás).
 */
async function calcularCustoFixoMedio3MesesFechados(hoje: Date): Promise<number | null> {
  const mesesPausados = await buscarMesesPausados();
  const meses = tresMesesFechadosNaoPausados(hoje, new Set(mesesPausados.keys()));
  if (meses.length < 3) return null;

  const custos = await Promise.all(
    meses.map(async (mes) => {
      const { inicio, fim } = limitesDoMes(mes);
      const entradasSaidasDoMes = await prisma.entradaSaida.findMany({
        where: { data: { gte: inicio, lt: fim } },
        select: SELECT_ENTRADAS_SAIDAS_CUSTO_FIXO,
      });
      return calcularCustosFixosMes(entradasSaidasDoMes);
    }),
  );

  return custos.reduce((total, custo) => total + custo, 0) / custos.length;
}

export async function calcularCaixaLivre(
  horizonteDias: number,
  reservaMesesCustoFixo: number,
  hoje: Date = new Date(),
): Promise<ResultadoCaixaLivre> {
  const [todasEntradasSaidas, saidasProgramadas, custoFixoMedio] = await Promise.all([
    prisma.entradaSaida.findMany({ select: { tipo: true, valor: true } }),
    calcularSaidasProgramadas(horizonteDias, hoje),
    calcularCustoFixoMedio3MesesFechados(hoje),
  ]);

  const saldoAtual = calcularSaldoAtual(todasEntradasSaidas);
  const reservaMinima = custoFixoMedio !== null ? reservaMesesCustoFixo * custoFixoMedio : 0;
  const caixaLivre = saldoAtual - saidasProgramadas - reservaMinima;

  return {
    saldoAtual,
    saidasProgramadas,
    reservaMinima,
    reservaMinimaCalculada: custoFixoMedio !== null,
    caixaLivre,
    horizonteDias,
  };
}
