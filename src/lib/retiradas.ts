import { limitesDoMes } from "@/lib/financeiro";
import { ultimosMeses } from "@/lib/analise";

export type RetiradaResumo = { valor: number; data: Date };

/** Total retirado no mês informado ("YYYY-MM"). */
export function calcularTotalRetiradoNoMes(retiradas: RetiradaResumo[], mes: string) {
  const { inicio, fim } = limitesDoMes(mes);
  return retiradas
    .filter((r) => r.data.getTime() >= inicio.getTime() && r.data.getTime() < fim.getTime())
    .reduce((total, r) => total + r.valor, 0);
}

/** Soma simples retirada nos últimos 3 meses (mês atual incluso). */
export function calcularTotalRetiradoUltimos3Meses(
  retiradas: RetiradaResumo[],
  hoje: Date = new Date(),
) {
  const meses = ultimosMeses(3, hoje);
  const inicioJanela = limitesDoMes(meses[0]).inicio;
  const fimJanela = limitesDoMes(meses[meses.length - 1]).fim;
  return retiradas
    .filter(
      (r) => r.data.getTime() >= inicioJanela.getTime() && r.data.getTime() < fimJanela.getTime(),
    )
    .reduce((total, r) => total + r.valor, 0);
}

// ---------- Retirada saudável / semáforo ----------
// Tipos e funções puras (sem Prisma) — a orquestração que consulta o banco
// para produzir um EstadoRetiradaSaudavel vive em lib/retiradas-calculo.ts,
// que só deve ser importado de Server Components/actions.

export const MOTIVO_LABEL: Record<string, string> = {
  rotina: "Rotina",
  imprevisto: "Imprevisto",
  investimento: "Investimento pessoal",
  outro: "Outro",
};

export const MOTIVOS_RETIRADA = ["rotina", "imprevisto", "investimento", "outro"] as const;

export type EstadoRetiradaSaudavel =
  | { estado: "sem_historico_sem_prolabore" }
  | {
      estado: "sem_historico_com_prolabore";
      retiradaSaudavel: number;
      retiradaMaxima: number;
    }
  | {
      estado: "com_historico";
      retiradaSaudavel: number;
      retiradaMaxima: number;
      sobraMedia: number;
      proLaboreCombinado: number | null;
    };

export type EstadoSemaforo = "verde" | "laranja" | "vermelho" | "cinza";

/**
 * Verde: dentro da retirada saudável. Laranja: entre a saudável e a
 * máxima. Vermelho (dessaturado): acima da máxima. Cinza: ainda sem dado
 * suficiente para calcular (nenhum histórico e sem pró-labore combinado).
 */
export function calcularSemaforoRetirada(
  estado: EstadoRetiradaSaudavel,
  totalRetiradoMes: number,
): EstadoSemaforo {
  if (estado.estado === "sem_historico_sem_prolabore") return "cinza";
  if (totalRetiradoMes <= estado.retiradaSaudavel) return "verde";
  if (totalRetiradoMes <= estado.retiradaMaxima) return "laranja";
  return "vermelho";
}

/**
 * Percentual retirado acima da retirada saudável — só retorna um valor
 * quando de fato há excesso (e a retirada saudável é positiva, para não
 * dividir por zero); caso contrário `null` (nada a exibir).
 */
export function calcularPercentualAcimaRecomendado(
  estado: EstadoRetiradaSaudavel,
  totalRetiradoMes: number,
): number | null {
  if (estado.estado === "sem_historico_sem_prolabore") return null;
  if (estado.retiradaSaudavel <= 0) return null;
  if (totalRetiradoMes <= estado.retiradaSaudavel) return null;
  return (totalRetiradoMes / estado.retiradaSaudavel - 1) * 100;
}

/**
 * Entre as retiradas de um único mês, marca (pelo id) as que aconteceram
 * quando o total acumulado daquele mês, somando em ordem cronológica até
 * ali, já passava da retirada saudável — usada para destacar essas linhas
 * na listagem.
 */
export function marcarRetiradasAcimaDoRecomendado<
  T extends { id: string; valor: number; data: Date; createdAt: Date },
>(retiradasDoMes: T[], retiradaSaudavel: number): Set<string> {
  const ordenadas = [...retiradasDoMes].sort((a, b) => {
    const porData = a.data.getTime() - b.data.getTime();
    return porData !== 0 ? porData : a.createdAt.getTime() - b.createdAt.getTime();
  });

  const destacadas = new Set<string>();
  let acumulado = 0;
  for (const retirada of ordenadas) {
    acumulado += retirada.valor;
    if (acumulado > retiradaSaudavel) destacadas.add(retirada.id);
  }
  return destacadas;
}
