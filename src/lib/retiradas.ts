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
