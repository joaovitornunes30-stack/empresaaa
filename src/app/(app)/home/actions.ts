"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, type ActionState } from "@/lib/auth";
import { comSessaoSimplesAba } from "@/lib/permissoes";
import { OBJETIVO_TEXTO_MAX } from "@/lib/checklist";

export type { ActionState };

const objetivoSchema = z.object({
  objetivoPrincipal: z.enum(["lucro_real", "caixa_contas", "precificar", "quanto_retirar", "vender_reter", "estoque", "outro", "pular"]),
  objetivoTexto: z
    .string()
    .trim()
    .max(OBJETIVO_TEXTO_MAX, `Máximo de ${OBJETIVO_TEXTO_MAX} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null)),
});

/** Só o dono escolhe/troca o objetivo — consultor vê em leitura, membro nem isso. */
export const escolherObjetivo = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = objetivoSchema.safeParse({
    objetivoPrincipal: formData.get("objetivoPrincipal"),
    objetivoTexto: formData.get("objetivoTexto") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { objetivoPrincipal, objetivoTexto } = parsed.data;

  await prisma.clinica.update({
    where: { id: ctx.clinicaId },
    data: {
      objetivoPrincipal,
      objetivoTexto: objetivoPrincipal === "outro" ? objetivoTexto : null,
      // Escolher (ou trocar) o objetivo sempre volta a mostrar a checklist.
      checklistDispensada: false,
    },
  });

  revalidatePath("/home");
  return { error: null };
});

export const dispensarChecklist = comSessao(["dono"], async (ctx, _prevState, _formData) => {
  await prisma.clinica.update({ where: { id: ctx.clinicaId }, data: { checklistDispensada: true } });
  revalidatePath("/home");
  return { error: null };
});

/**
 * Fato da clínica (não de um usuário específico) — qualquer um que acesse
 * Produtos pode disparar, igual aos outros passos da checklist que também
 * são inferidos independentemente de quem realizou a ação.
 */
export const marcarAbriuMargemProduto = comSessaoSimplesAba("produtos", async (ctx) => {
  const clinica = await prisma.clinica.findUniqueOrThrow({
    where: { id: ctx.clinicaId },
    select: { abriuMargemProduto: true },
  });
  if (clinica.abriuMargemProduto) return;
  await prisma.clinica.update({ where: { id: ctx.clinicaId }, data: { abriuMargemProduto: true } });
  revalidatePath("/home");
});
