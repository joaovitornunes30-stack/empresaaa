// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. A consulta ao banco (quais passos já foram concluídos) vive
// em lib/checklist-calculo.ts, que só deve ser importado de Server
// Components/actions. Ver Complemento à Home, Parte B.

export type ObjetivoPrincipal =
  | "lucro_real"
  | "caixa_contas"
  | "precificar"
  | "quanto_retirar"
  | "vender_reter"
  | "estoque"
  | "outro"
  | "pular";

// Os 7 cartões clicáveis de escolha única (o 7º é "Outro", com campo de
// texto livre). "pular" não é um cartão — só existe quando o dono usa o
// botão "Pular por enquanto", mas usa a mesma checklist padrão de "outro".
export const OBJETIVOS_CARTAO: ObjetivoPrincipal[] = [
  "lucro_real",
  "caixa_contas",
  "precificar",
  "quanto_retirar",
  "vender_reter",
  "estoque",
  "outro",
];

export const OBJETIVO_LABEL: Record<ObjetivoPrincipal, string> = {
  lucro_real: "Saber se estou tendo lucro de verdade",
  caixa_contas: "Organizar caixa e contas",
  precificar: "Precificar melhor meus produtos",
  quanto_retirar: "Saber quanto posso retirar",
  vender_reter: "Vender mais e reter pacientes",
  estoque: "Controlar o estoque",
  outro: "Outro",
  pular: "Ainda não escolhido",
};

export const OBJETIVO_TEXTO_MAX = 200;

export type PassoChecklist =
  | "perfil_tributario"
  | "primeiro_produto"
  | "abrir_margem_produto"
  | "primeira_entrada"
  | "primeira_saida"
  | "despesa_ou_divida"
  | "meta_do_mes"
  | "primeira_retirada"
  | "custo_de_vida"
  | "primeiro_cliente"
  | "primeiro_movimento_estoque";

export const PASSO_LABEL: Record<PassoChecklist, string> = {
  perfil_tributario: "Cadastre um perfil tributário",
  primeiro_produto: "Cadastre seu primeiro produto",
  abrir_margem_produto: "Veja a margem de um produto",
  primeira_entrada: "Registre sua primeira entrada",
  primeira_saida: "Registre sua primeira saída",
  despesa_ou_divida: "Cadastre uma despesa administrativa ou dívida",
  meta_do_mes: "Defina a meta do mês",
  primeira_retirada: "Registre sua primeira retirada",
  custo_de_vida: 'Preencha "Meu custo de vida"',
  primeiro_cliente: "Cadastre seu primeiro cliente",
  primeiro_movimento_estoque: "Registre um movimento de estoque",
};

export const PASSO_ROTA: Record<PassoChecklist, string> = {
  perfil_tributario: "/produtos",
  primeiro_produto: "/produtos",
  abrir_margem_produto: "/produtos",
  primeira_entrada: "/financeiro",
  primeira_saida: "/financeiro",
  despesa_ou_divida: "/financeiro",
  meta_do_mes: "/analise",
  primeira_retirada: "/retiradas",
  custo_de_vida: "/retiradas",
  primeiro_cliente: "/clientes",
  primeiro_movimento_estoque: "/produtos",
};

/**
 * Até 5 passos por objetivo. "outro" e "pular" compartilham a mesma
 * checklist padrão (os "4 passos originais").
 */
export const PASSOS_POR_OBJETIVO: Record<ObjetivoPrincipal, PassoChecklist[]> = {
  lucro_real: ["perfil_tributario", "primeiro_produto", "primeira_entrada", "primeira_saida", "meta_do_mes"],
  caixa_contas: ["primeira_entrada", "primeira_saida", "despesa_ou_divida", "perfil_tributario", "meta_do_mes"],
  precificar: ["perfil_tributario", "primeiro_produto", "abrir_margem_produto", "primeira_entrada", "meta_do_mes"],
  quanto_retirar: ["primeira_entrada", "primeira_saida", "primeira_retirada", "custo_de_vida", "perfil_tributario"],
  vender_reter: ["primeiro_cliente", "primeiro_produto", "primeira_entrada", "perfil_tributario", "meta_do_mes"],
  estoque: ["primeiro_produto", "primeiro_movimento_estoque", "primeira_entrada", "perfil_tributario", "meta_do_mes"],
  outro: ["perfil_tributario", "primeiro_produto", "primeira_entrada", "primeira_saida"],
  pular: ["perfil_tributario", "primeiro_produto", "primeira_entrada", "primeira_saida"],
};

export type ProgressoChecklist = {
  passos: { passo: PassoChecklist; concluido: boolean }[];
  concluidos: number;
  total: number;
  completa: boolean;
};

export function montarChecklist(
  objetivo: ObjetivoPrincipal,
  concluidos: Record<PassoChecklist, boolean>,
): ProgressoChecklist {
  const passos = PASSOS_POR_OBJETIVO[objetivo].map((passo) => ({ passo, concluido: !!concluidos[passo] }));
  const total = passos.length;
  const quantidadeConcluidos = passos.filter((p) => p.concluido).length;
  return { passos, concluidos: quantidadeConcluidos, total, completa: quantidadeConcluidos === total };
}
