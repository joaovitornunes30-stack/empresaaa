"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = {
  error: string | null;
};

const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto."),
  precoVenda: z.coerce.number().positive("Preço de venda deve ser maior que zero."),
  custoMedioMaterial: z.coerce
    .number()
    .min(0, "Custo médio não pode ser negativo."),
  perfilTributarioId: z.string().trim().min(1, "Selecione um perfil tributário."),
});

export async function criarProduto(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    precoVenda: formData.get("precoVenda"),
    custoMedioMaterial: formData.get("custoMedioMaterial"),
    perfilTributarioId: formData.get("perfilTributarioId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.produto.create({ data: parsed.data });

  revalidatePath("/produtos");
  return { error: null };
}

const perfilSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do perfil."),
  aliquota: z.coerce
    .number()
    .min(0, "Alíquota não pode ser negativa.")
    .max(100, "Alíquota não pode ser maior que 100%."),
});

export async function criarPerfilTributario(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = perfilSchema.safeParse({
    nome: formData.get("nome"),
    aliquota: formData.get("aliquota"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.perfilTributario.create({ data: parsed.data });

  revalidatePath("/produtos");
  return { error: null };
}

const editarPerfilSchema = perfilSchema.extend({
  id: z.string().trim().min(1),
});

export async function editarPerfilTributario(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = editarPerfilSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    aliquota: formData.get("aliquota"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, ...data } = parsed.data;
  await prisma.perfilTributario.update({ where: { id }, data });

  revalidatePath("/produtos");
  return { error: null };
}
