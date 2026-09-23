"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = {
  error: string | null;
};

const metaDoMesSchema = z.object({
  mesReferencia: z.string().trim().regex(/^\d{4}-\d{2}$/, "Mês inválido."),
  valorMeta: z.coerce.number().positive("Valor deve ser maior que zero."),
});

export async function definirMetaDoMes(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = metaDoMesSchema.safeParse({
    mesReferencia: formData.get("mesReferencia"),
    valorMeta: formData.get("valorMeta"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { mesReferencia, valorMeta } = parsed.data;

  await prisma.metaDoMes.upsert({
    where: { mesReferencia },
    create: { mesReferencia, valorMeta },
    update: { valorMeta },
  });

  revalidatePath("/analise");
  return { error: null };
}

const movimentoEstoqueSchema = z.object({
  produtoId: z.string().trim().min(1, "Selecione um produto."),
  tipo: z.enum(["entrada", "saida"], { error: "Selecione o tipo." }),
  quantidade: z.coerce
    .number()
    .int("Quantidade deve ser um número inteiro.")
    .positive("Quantidade deve ser maior que zero."),
  data: z.coerce.date({ error: "Informe uma data válida." }),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function registrarMovimentoEstoque(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = movimentoEstoqueSchema.safeParse({
    produtoId: formData.get("produtoId"),
    tipo: formData.get("tipo"),
    quantidade: formData.get("quantidade"),
    data: formData.get("data"),
    descricao: formData.get("descricao") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.estoqueMovimento.create({ data: parsed.data });

  revalidatePath("/analise");
  return { error: null };
}
