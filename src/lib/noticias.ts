// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. A consulta ao banco vive em lib/noticias-calculo.ts. Ver
// Complemento à Home, Parte C.
import { z } from "zod";

export type CategoriaNoticia = "gestao_financas" | "impostos_legislacao" | "regulacao" | "mercado_tendencias";

export const CATEGORIA_LABEL: Record<CategoriaNoticia, string> = {
  gestao_financas: "Gestão e finanças",
  impostos_legislacao: "Impostos e legislação",
  regulacao: "Regulação",
  mercado_tendencias: "Mercado e tendências",
};

export const CATEGORIAS: CategoriaNoticia[] = [
  "gestao_financas",
  "impostos_legislacao",
  "regulacao",
  "mercado_tendencias",
];

export function ehCategoriaNoticia(valor: string): valor is CategoriaNoticia {
  return (CATEGORIAS as string[]).includes(valor);
}

export const RESUMO_NOTICIA_MAX = 280;

const segmentoSchema = z.string().refine(
  (v) => v === "todos" || ["estetica", "odontologia", "medicina", "fisioterapia", "psicologia", "outra"].includes(v),
  "Segmento inválido — use um tipo de clínica ou \"todos\".",
);

/** Schema compartilhado entre o formulário de admin e a importação por
 * JSON (POST /api/admin/noticias/importar) — mesma validação nos dois. */
export const noticiaInputSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título."),
  resumo: z.string().trim().min(1, "Informe o resumo.").max(RESUMO_NOTICIA_MAX, `Resumo deve ter no máximo ${RESUMO_NOTICIA_MAX} caracteres.`),
  fonteNome: z.string().trim().min(1, "Informe o nome da fonte."),
  link: z.string().trim().url("Informe um link válido."),
  dataPublicacao: z.coerce.date({ message: "Data de publicação inválida." }),
  categoria: z.enum(["gestao_financas", "impostos_legislacao", "regulacao", "mercado_tendencias"]),
  segmentos: z.array(segmentoSchema).min(1, "Informe ao menos um segmento."),
  destaque: z.boolean().optional().default(false),
});

export type NoticiaInput = z.infer<typeof noticiaInputSchema>;

export type NoticiaResumo = {
  id: string;
  titulo: string;
  resumo: string;
  fonteNome: string;
  link: string;
  dataPublicacao: Date;
  categoria: CategoriaNoticia;
  segmentos: string[];
  destaque: boolean;
  status: "rascunho" | "publicado";
  exemplo: boolean;
};

/** Uma clínica sem tipoClinica definido só vê notícias com segmento "todos". */
export function noticiaVisivelParaTipo(segmentos: string[], tipoClinica: string | null): boolean {
  if (segmentos.includes("todos")) return true;
  if (!tipoClinica) return false;
  return segmentos.includes(tipoClinica);
}

/** Destaque primeiro, depois mais recente. */
export function ordenarNoticias<T extends { destaque: boolean; dataPublicacao: Date }>(noticias: T[]): T[] {
  return [...noticias].sort((a, b) => {
    if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
    return b.dataPublicacao.getTime() - a.dataPublicacao.getTime();
  });
}

export function filtrarPorCategoria<T extends { categoria: CategoriaNoticia }>(
  noticias: T[],
  categoria: CategoriaNoticia | null,
): T[] {
  if (!categoria) return noticias;
  return noticias.filter((n) => n.categoria === categoria);
}
