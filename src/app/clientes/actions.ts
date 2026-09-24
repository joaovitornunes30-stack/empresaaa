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
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  cpf: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  dataNascimento: z.coerce
    .date({ error: "Informe uma data de nascimento válida." })
    .optional(),
  dataPrimeiroProcedimento: z.coerce
    .date({ error: "Informe uma data válida para o primeiro procedimento." })
    .optional(),
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

function lerClienteFormData(formData: FormData) {
  return {
    nome: formData.get("nome"),
    contato: formData.get("contato") || undefined,
    email: formData.get("email") || undefined,
    cpf: formData.get("cpf") || undefined,
    dataNascimento: formData.get("dataNascimento") || undefined,
    dataPrimeiroProcedimento: formData.get("dataPrimeiroProcedimento") || undefined,
    observacoes: formData.get("observacoes") || undefined,
    origem: formData.get("origem") || undefined,
    indicadoPorId: formData.get("indicadoPorId") || undefined,
  };
}

export async function criarCliente(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = clienteSchema.safeParse(lerClienteFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.cliente.create({ data: parsed.data });

  revalidatePath("/clientes");
  return { error: null };
}

const editarClienteSchema = clienteSchema.extend({
  id: z.string().trim().min(1),
});

export async function editarCliente(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = editarClienteSchema.safeParse({
    ...lerClienteFormData(formData),
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, ...data } = parsed.data;

  await prisma.cliente.update({
    where: { id },
    data: {
      ...data,
      contato: data.contato ?? null,
      email: data.email ?? null,
      cpf: data.cpf ?? null,
      dataNascimento: data.dataNascimento ?? null,
      dataPrimeiroProcedimento: data.dataPrimeiroProcedimento ?? null,
      observacoes: data.observacoes ?? null,
      origem: data.origem ?? null,
      indicadoPorId: data.indicadoPorId ?? null,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
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
