"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/auth";
import { noticiaInputSchema } from "@/lib/noticias";

export type ActionState = { error: string | null };

/**
 * Notícia é uma tabela global, não isolada por clínica — nada aqui roda
 * dentro de runWithTenant (não há nenhum para adminPlataforma, que não
 * pertence a clínica nenhuma). A única checagem é o papel da sessão.
 */
async function exigirAdminPlataforma() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "adminPlataforma") {
    return null;
  }
  return sessao;
}

function lerSegmentos(formData: FormData): string[] {
  return formData.getAll("segmentos").map(String);
}

export async function salvarNoticia(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const sessao = await exigirAdminPlataforma();
  if (!sessao) return { error: "Você não tem permissão para esta ação." };

  const parsed = noticiaInputSchema.safeParse({
    titulo: formData.get("titulo"),
    resumo: formData.get("resumo"),
    fonteNome: formData.get("fonteNome"),
    link: formData.get("link"),
    dataPublicacao: formData.get("dataPublicacao"),
    categoria: formData.get("categoria"),
    segmentos: lerSegmentos(formData),
    destaque: formData.get("destaque") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const idExistente = formData.get("id");
  if (typeof idExistente === "string" && idExistente) {
    await prisma.noticia.update({ where: { id: idExistente }, data: parsed.data });
  } else {
    await prisma.noticia.create({ data: { ...parsed.data, status: "rascunho" } });
  }

  revalidatePath("/noticias");
  return { error: null };
}

export async function alternarPublicacaoNoticia(id: string): Promise<void> {
  const sessao = await exigirAdminPlataforma();
  if (!sessao) throw new Error("Você não tem permissão para esta ação.");

  const noticia = await prisma.noticia.findUniqueOrThrow({ where: { id }, select: { status: true } });
  await prisma.noticia.update({
    where: { id },
    data: { status: noticia.status === "publicado" ? "rascunho" : "publicado" },
  });

  revalidatePath("/noticias");
}

export async function excluirNoticia(id: string): Promise<void> {
  const sessao = await exigirAdminPlataforma();
  if (!sessao) throw new Error("Você não tem permissão para esta ação.");

  await prisma.noticia.delete({ where: { id } });
  revalidatePath("/noticias");
}
