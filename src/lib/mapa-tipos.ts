// Tipos puros (sem Prisma) do "Seu Mapa" da Home — importáveis tanto de
// Server quanto de Client Components. A consulta ao banco e os cálculos
// vivem em lib/mapa-predicados.ts, lib/mapa-estacoes.ts e lib/mapa.ts, que
// só devem ser importados de Server Components/actions.

export type TamanhoEstacao = "pequena" | "media" | "grande" | "bonus";
export type TipoEstacao = "obrigatoria" | "sugestao";
export type RotaMapa = "produtos" | "financeiro" | "analise" | "retiradas" | "clientes";
export type MarcoEstacao = "casa" | "banca" | "balanca" | "morro" | "ponte" | "castelo" | "farol" | "placa";

export type SubpassoEstacao = {
  label: string;
  concluido: boolean;
};

export type EstacaoMapa = {
  id: string;
  tamanho: TamanhoEstacao;
  tipo: TipoEstacao;
  marco: MarcoEstacao;
  titulo: string;
  porque: string;
  /** Substitui `porque` quando há texto calculado (números da meta, sugestões dinâmicas). */
  textoDinamico: string | null;
  subpassos: SubpassoEstacao[];
  rota: RotaMapa;
  /** Só aparece no mapa quando true — sempre true para estações não-condicionais. */
  visivel: boolean;
  /** true quando a conquista está gravada (persistente) OU, para a bônus, quando o predicado está true agora. */
  concluida: boolean;
  /** Data em que a estação foi conquistada pela primeira vez (se já gravada). */
  conquistadaEm: Date | null;
};

export type EstadoMapa = {
  estacoes: EstacaoMapa[];
  /** Entre as obrigatórias visíveis: índice 1-based da estação atual, e o total. */
  estacaoAtualIndice: number;
  totalObrigatoriasVisiveis: number;
  estacaoAtualId: string | null;
  /** true quando todas as obrigatórias visíveis estão concluídas. */
  todasObrigatoriasConcluidas: boolean;
};
