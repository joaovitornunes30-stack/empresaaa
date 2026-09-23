"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = {
  error: string | null;
};

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  contato: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  origem: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  indicadoPorId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function criarCliente(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = clienteSchema.safeParse({
    nome: formData.get("nome"),
    contato: formData.get("contato") || undefined,
    observacoes: formData.get("observacoes") || undefined,
    origem: formData.get("origem") || undefined,
    indicadoPorId: formData.get("indicadoPorId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.cliente.create({ data: parsed.data });

  revalidatePath("/clientes");
  return { error: null };
}

const observacoesSchema = z.object({
  id: z.string().trim().min(1),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function atualizarObservacoesCliente(formData: FormData) {
  const parsed = observacoesSchema.safeParse({
    id: formData.get("id"),
    observacoes: formData.get("observacoes") || undefined,
  });

  if (!parsed.success) return;

  await prisma.cliente.update({
    where: { id: parsed.data.id },
    data: { observacoes: parsed.data.observacoes ?? null },
  });

  revalidatePath("/clientes");
}
