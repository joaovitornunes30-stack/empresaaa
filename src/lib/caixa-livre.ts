// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. A orquestração que consulta o banco (saídas programadas,
// custo fixo médio, saldo atual) vive em lib/caixa-livre-calculo.ts, que só
// deve ser importado de Server Components/actions.
import type { EstadoRetiradaSaudavel } from "@/lib/retiradas";

export type ResultadoCaixaLivre = {
  saldoAtual: number;
  saidasProgramadas: number;
  reservaMinima: number;
  // false quando ainda não há 3 meses fechados para calcular a reserva —
  // nesse caso reservaMinima fica em 0, não inventada.
  reservaMinimaCalculada: boolean;
  caixaLivre: number;
  horizonteDias: number;
  // true quando existe ao menos uma Divida "nao_estruturada" (sem
  // parcelamento) — ela não entra em "saídas já programadas" (não tem
  // Parcela nenhuma gerada ainda), então o Caixa livre pode estar
  // otimista. Puramente informativo: nunca altera a conta.
  temDividaNaoEstruturada: boolean;
};

export type RetiradaIdealResultado =
  | { estado: "sem_dado"; caixaLivre: ResultadoCaixaLivre }
  | { estado: "nao_retire_agora"; retiradaIdeal: 0; caixaLivre: ResultadoCaixaLivre }
  | {
      estado: "calculado";
      retiradaIdeal: number;
      retiradaSaudavel: number;
      filtroLimitante: "saudavel" | "caixa" | "empate";
      caixaLivre: ResultadoCaixaLivre;
    };

/**
 * Retirada ideal = menor valor entre a Retirada saudável (filtro de
 * resultado, já existente) e o Caixa livre (filtro de caixa, Parte 1).
 * Se o caixa livre for negativo, a retirada ideal é 0 e o motivo é sempre
 * "Não retire agora" — nunca uma retirada negativa.
 */
export function calcularRetiradaIdeal(
  estadoSaudavel: EstadoRetiradaSaudavel,
  caixaLivreResultado: ResultadoCaixaLivre,
): RetiradaIdealResultado {
  if (estadoSaudavel.estado === "sem_historico_sem_prolabore") {
    return { estado: "sem_dado", caixaLivre: caixaLivreResultado };
  }

  if (caixaLivreResultado.caixaLivre < 0) {
    return { estado: "nao_retire_agora", retiradaIdeal: 0, caixaLivre: caixaLivreResultado };
  }

  const retiradaSaudavel = estadoSaudavel.retiradaSaudavel;
  const caixaLivre = caixaLivreResultado.caixaLivre;
  const retiradaIdeal = Math.min(retiradaSaudavel, caixaLivre);
  const filtroLimitante: "saudavel" | "caixa" | "empate" =
    retiradaSaudavel === caixaLivre ? "empate" : retiradaSaudavel < caixaLivre ? "saudavel" : "caixa";

  return { estado: "calculado", retiradaIdeal, retiradaSaudavel, filtroLimitante, caixaLivre: caixaLivreResultado };
}

export type EstadoSemaforoIdeal = "verde" | "laranja" | "vermelho" | "cinza";

/**
 * O semáforo deriva sempre da Retirada ideal — nunca um estado que
 * contradiga "Não retire agora". Se a retirada ideal é 0 (caixa livre
 * negativo, ou sobra média que zera a retirada saudável), o estado é
 * sempre vermelho, mesmo que ainda não tenha sido retirado nada no mês.
 * Só quando a ideal é positiva existe uma faixa verde/laranja/vermelho,
 * com o teto de "laranja" na retirada máxima já existente (que nunca fica
 * abaixo da ideal, então não há contradição possível aí).
 */
export function calcularSemaforoRetiradaIdeal(
  resultado: RetiradaIdealResultado,
  estadoSaudavel: EstadoRetiradaSaudavel,
  totalRetiradoMes: number,
): EstadoSemaforoIdeal {
  if (resultado.estado === "sem_dado") return "cinza";
  if (resultado.estado === "nao_retire_agora") return "vermelho";

  const ideal = resultado.retiradaIdeal;
  if (ideal <= 0) return "vermelho";

  const maxima = estadoSaudavel.estado === "sem_historico_sem_prolabore" ? ideal : estadoSaudavel.retiradaMaxima;

  if (totalRetiradoMes <= ideal) return "verde";
  if (totalRetiradoMes <= maxima) return "laranja";
  return "vermelho";
}
