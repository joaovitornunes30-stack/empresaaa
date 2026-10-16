import { prisma } from "@/lib/prisma";
import { noticiaVisivelParaTipo, ordenarNoticias, type NoticiaResumo } from "@/lib/noticias";

const SELECT_NOTICIA_RESUMO = {
  id: true,
  titulo: true,
  resumo: true,
  fonteNome: true,
  link: true,
  dataPublicacao: true,
  categoria: true,
  segmentos: true,
  destaque: true,
  status: true,
  exemplo: true,
} as const;

/** Notícias publicadas e visíveis para o tipoClinica da clínica (global —
 * Noticia não é isolada por clínica, ver MODELOS_COM_CLINICA). */
export async function buscarNoticiasPublicadasParaClinica(tipoClinica: string | null): Promise<NoticiaResumo[]> {
  const noticias = await prisma.noticia.findMany({
    where: { status: "publicado" },
    select: SELECT_NOTICIA_RESUMO,
    orderBy: { dataPublicacao: "desc" },
  });
  const visiveis = noticias.filter((n) => noticiaVisivelParaTipo(n.segmentos, tipoClinica));
  return ordenarNoticias(visiveis) as NoticiaResumo[];
}

/** Só para adminPlataforma — todas as notícias, inclusive rascunho. */
export async function buscarTodasNoticiasAdmin(): Promise<NoticiaResumo[]> {
  const noticias = await prisma.noticia.findMany({
    select: SELECT_NOTICIA_RESUMO,
    orderBy: { createdAt: "desc" },
  });
  return noticias as NoticiaResumo[];
}
