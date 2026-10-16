"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/auth";

/**
 * Recolher/abrir o mapa é uma preferência pessoal de tela (não um dado da
 * clínica) — por isso não usa comSessao/comSessaoSimples, que bloqueiam
 * consultor para QUALQUER gravação. Dono e consultor podem ambos recolher o
 * próprio mapa; membro nunca vê o mapa, então nunca chama esta ação.
 */
export async function alternarMapaRecolhido(recolhido: boolean): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "dono" && sessao.papel !== "consultor") return;

  await prisma.usuario.update({ where: { id: sessao.usuarioId }, data: { mapaRecolhido: recolhido } });
  revalidatePath("/home");
}
