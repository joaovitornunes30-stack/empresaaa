// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. A consulta ao banco vive em lib/atencao-calculo.ts. Ver
// Complemento à Home, Parte B, e Correção da Home, item 3.
import type { ObjetivoPrincipal } from "@/lib/checklist";

// Mesma ideia do tipo Aba de lib/permissoes.ts, só que restrita às abas que
// de fato recebem um item de atenção — mantido local para este módulo
// continuar livre de qualquer import que puxe Prisma.
export type RotaAtencao = "analise" | "produtos" | "clientes" | "financeiro" | "retiradas";

export type ItemAtencao = {
  id: string;
  texto: string;
  rota: RotaAtencao;
  // true = item fixo (caixa negativo, vencimentos em 7 dias): sempre no
  // topo, na própria ordem entre si, nunca reordenado nem pelo objetivo.
  fixo: boolean;
  // null = sem ligação com nenhum objetivo específico.
  objetivoRelacionado: ObjetivoPrincipal | null;
};

export const MAXIMO_ITENS_ATENCAO = 5;

/**
 * Itens fixos sempre primeiro, na própria ordem entre si. Entre os demais
 * (já entregues em ordem de prioridade fixa pelo chamador), o item ligado
 * ao objetivo atual sobe EXATAMENTE uma posição (troca de lugar com o item
 * imediatamente acima) — nunca pula para o topo da lista inteira, e nunca
 * ultrapassa a fronteira dos itens fixos. Não corta em 5 aqui — isso é
 * responsabilidade de quem chama, depois de aplicar o filtro de permissão
 * (ver Correção da Home, item 3: "Membro vê os itens das áreas a que tem
 * permissão").
 */
export function ordenarItensAtencao(
  itensAtivos: ItemAtencao[],
  objetivoAtual: ObjetivoPrincipal | null,
): ItemAtencao[] {
  const fixos = itensAtivos.filter((item) => item.fixo);
  const flexiveis = itensAtivos.filter((item) => !item.fixo);

  if (!objetivoAtual) return [...fixos, ...flexiveis];

  const indice = flexiveis.findIndex((item) => item.objetivoRelacionado === objetivoAtual);
  if (indice <= 0) return [...fixos, ...flexiveis];

  const reordenados = [...flexiveis];
  [reordenados[indice - 1], reordenados[indice]] = [reordenados[indice], reordenados[indice - 1]];
  return [...fixos, ...reordenados];
}
