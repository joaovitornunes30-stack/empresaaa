import { prisma } from "@/lib/prisma";
import { adicionarDias, adicionarMeses } from "@/lib/financeiro";
import { tenantAtual } from "@/lib/tenant-context";

export const DIAS_POR_FREQUENCIA: Record<string, number> = {
  semanal: 7,
  quinzenal: 14,
  "60dias": 60,
};

export function primeiroDiaDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

/**
 * Um período (primeiro dia do mês) por mês, do mês de `inicio` até o mês de
 * `hoje`, inclusive — usado para gerar o salário mensal de um Funcionario
 * ativo desde o seu cadastro.
 */
export function gerarPeriodosFuncionario(inicio: Date, hoje: Date = new Date()): Date[] {
  const periodos: Date[] = [];
  let cursor = primeiroDiaDoMes(inicio);
  const limite = primeiroDiaDoMes(hoje);
  while (cursor <= limite) {
    periodos.push(cursor);
    cursor = adicionarMeses(cursor, 1);
  }
  return periodos;
}

/**
 * Uma ocorrência a cada `frequencia`, a partir de `dataInicio`, até `hoje`
 * (inclusive) — usado para gerar os lançamentos de uma DespesaAdministrativa
 * recorrente ativa.
 */
export function gerarPeriodosDespesaRecorrente(
  dataInicio: Date,
  frequencia: string,
  hoje: Date = new Date(),
): Date[] {
  const periodos: Date[] = [];
  let cursor = new Date(dataInicio);
  while (cursor <= hoje) {
    periodos.push(cursor);
    cursor =
      frequencia === "mensal"
        ? adicionarMeses(cursor, 1)
        : adicionarDias(cursor, DIAS_POR_FREQUENCIA[frequencia] ?? 30);
  }
  return periodos;
}

/**
 * Gera (idempotentemente) os lançamentos automáticos ainda faltantes: o
 * salário mensal de cada Funcionario ativo e cada ocorrência de
 * DespesaAdministrativa recorrente ativa, até o mês/período atual. Chamada
 * no carregamento de Financeiro e Análise — sem cron, a geração "pega o
 * atraso" sempre que alguém abre uma dessas páginas. Nunca recria nem
 * sobrescreve um lançamento já existente para o mesmo período
 * (funcionarioId/despesaAdministrativaId + data), graças ao
 * @@unique + skipDuplicates — uma edição pontual feita naquele lançamento
 * nunca é desfeita por uma sincronização seguinte.
 */
export async function sincronizarLancamentosRecorrentes() {
  const hoje = new Date();

  const [funcionarios, despesasRecorrentes] = await Promise.all([
    prisma.funcionario.findMany({ where: { ativo: true } }),
    prisma.despesaAdministrativa.findMany({ where: { ativo: true, recorrente: true } }),
  ]);

  const { clinicaId } = tenantAtual();

  const lancamentos: {
    tipo: string;
    categoria: string;
    valor: number;
    data: Date;
    descricao: string;
    funcionarioId?: string;
    despesaAdministrativaId?: string;
    clinicaId: string;
  }[] = [];

  for (const funcionario of funcionarios) {
    for (const data of gerarPeriodosFuncionario(funcionario.createdAt, hoje)) {
      lancamentos.push({
        tipo: "saida",
        categoria: "Salário",
        valor: funcionario.valorMensal,
        data,
        descricao: funcionario.nome,
        funcionarioId: funcionario.id,
        clinicaId,
      });
    }
  }

  for (const despesa of despesasRecorrentes) {
    if (!despesa.frequencia || !despesa.dataInicio) continue;
    for (const data of gerarPeriodosDespesaRecorrente(despesa.dataInicio, despesa.frequencia, hoje)) {
      lancamentos.push({
        tipo: "saida",
        categoria: "Despesa Administrativa",
        valor: despesa.valor,
        data,
        descricao: despesa.nome,
        despesaAdministrativaId: despesa.id,
        clinicaId,
      });
    }
  }

  if (lancamentos.length === 0) return;

  await prisma.entradaSaida.createMany({ data: lancamentos, skipDuplicates: true });
}
