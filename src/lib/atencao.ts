// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. A consulta ao banco vive em lib/atencao-calculo.ts. Ver
// Complemento à Home, Parte B, Efeito 2.
import type { ObjetivoPrincipal } from "@/lib/checklist";

export type ItemAtencao = {
  id: string;
  texto: string;
  // null = item fixo (sempre no topo, nunca reordenado).
  objetivoRelacionado: ObjetivoPrincipal | null;
};

/**
 * Itens fixos (caixa negativo, vencimentos em 7 dias) sempre primeiro, na
 * própria ordem entre si. Entre os demais, o item ligado ao objetivo atual
 * sobe EXATAMENTE uma posição (troca de lugar com o item imediatamente
 * acima) — nunca pula para o topo da lista inteira.
 */
export function ordenarItensAtencao(
  itensAtivos: ItemAtencao[],
  objetivoAtual: ObjetivoPrincipal | null,
): ItemAtencao[] {
  const fixos = itensAtivos.filter((item) => item.objetivoRelacionado === null);
  const flexiveis = itensAtivos.filter((item) => item.objetivoRelacionado !== null);

  if (!objetivoAtual) return [...fixos, ...flexiveis];

  const indice = flexiveis.findIndex((item) => item.objetivoRelacionado === objetivoAtual);
  if (indice <= 0) return [...fixos, ...flexiveis];

  const reordenados = [...flexiveis];
  [reordenados[indice - 1], reordenados[indice]] = [reordenados[indice], reordenados[indice - 1]];
  return [...fixos, ...reordenados];
}
