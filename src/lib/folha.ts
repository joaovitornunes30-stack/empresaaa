import { prisma } from "@/lib/prisma";
import { adicionarDias, adicionarMeses, mesAtual } from "@/lib/financeiro";
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
 * recorrente ativa. Para "mensal", cada período é `dataInicio` + N meses
 * (N = 0, 1, 2...) calculado sempre a partir da data de início original —
 * encadear a partir do cursor anterior faria o dia "escorregar" quando um
 * mês intermediário não tem esse dia (31/01 -> 28/02 -> 28/03 em vez de
 * 31/03). Frequências em dias (semanal/quinzenal/60dias) não têm essa
 * ambiguidade — adicionar um número fixo de dias é sempre exato.
 */
export function gerarPeriodosDespesaRecorrente(
  dataInicio: Date,
  frequencia: string,
  hoje: Date = new Date(),
): Date[] {
  const periodos: Date[] = [];

  if (frequencia === "mensal") {
    for (let n = 0; ; n += 1) {
      const data = adicionarMeses(dataInicio, n);
      if (data > hoje) break;
      periodos.push(data);
    }
    return periodos;
  }

  const passoDias = DIAS_POR_FREQUENCIA[frequencia] ?? 30;
  let cursor = new Date(dataInicio);
  while (cursor <= hoje) {
    periodos.push(cursor);
    cursor = adicionarDias(cursor, passoDias);
  }
  return periodos;
}

function diaISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

/**
 * Preenche periodoChave nos lançamentos automáticos que ainda não o têm
 * (gerados antes desse campo existir), a partir da própria `data` de cada
 * um — nunca da data de geração original, que não temos mais como saber.
 * Idempotente: uma vez preenchido, uma linha nunca é revisitada aqui.
 */
async function preencherPeriodoChaveFaltante() {
  const semPeriodo = await prisma.entradaSaida.findMany({
    where: {
      periodoChave: null,
      OR: [{ funcionarioId: { not: null } }, { despesaAdministrativaId: { not: null } }],
    },
    select: { id: true, data: true, funcionarioId: true },
  });

  if (semPeriodo.length === 0) return;

  await prisma.$transaction(
    semPeriodo.map((lancamento) =>
      prisma.entradaSaida.update({
        where: { id: lancamento.id },
        data: { periodoChave: lancamento.funcionarioId ? mesAtual(lancamento.data) : diaISO(lancamento.data) },
      }),
    ),
  );
}

/**
 * Gera (idempotentemente) os lançamentos automáticos ainda faltantes: o
 * salário mensal de cada Funcionario ativo e cada ocorrência de
 * DespesaAdministrativa recorrente ativa, até o mês/período atual. Chamada
 * no carregamento de Financeiro e Análise — sem cron, a geração "pega o
 * atraso" sempre que alguém abre uma dessas páginas. Nunca recria nem
 * sobrescreve um lançamento já existente para o mesmo período
 * (funcionarioId/despesaAdministrativaId + periodoChave), graças ao
 * @@unique + skipDuplicates — deduplicar pelo período (não pela `data`)
 * garante que editar pontualmente a data de um lançamento já gerado nunca
 * faz a sincronização seguinte recriá-lo.
 */
export async function sincronizarLancamentosRecorrentes() {
  const hoje = new Date();

  await preencherPeriodoChaveFaltante();

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
    periodoChave: string;
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
        periodoChave: mesAtual(data),
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
        periodoChave: diaISO(data),
        descricao: despesa.nome,
        despesaAdministrativaId: despesa.id,
        clinicaId,
      });
    }
  }

  if (lancamentos.length === 0) return;

  await prisma.entradaSaida.createMany({ data: lancamentos, skipDuplicates: true });
}
