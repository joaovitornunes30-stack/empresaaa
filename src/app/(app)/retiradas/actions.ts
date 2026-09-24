"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, type ActionState } from "@/lib/auth";

export type { ActionState };

const retiradaSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  data: z.coerce.date({ error: "Informe uma data válida." }),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const criarRetirada = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = retiradaSchema.safeParse({
    valor: formData.get("valor"),
    data: formData.get("data"),
    descricao: formData.get("descricao") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.retirada.create({ data: { ...parsed.data, clinicaId: ctx.clinicaId } });

  revalidatePath("/retiradas");
  return { error: null };
});
