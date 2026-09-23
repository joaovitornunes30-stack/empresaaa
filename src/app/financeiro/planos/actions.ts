"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = {
  error: string | null;
};

const marcarEntregueSchema = z.object({
  id: z.string().trim().min(1),
  dataEntregue: z.coerce.date({ error: "Informe uma data válida." }),
});

export async function marcarSessaoEntregue(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = marcarEntregueSchema.safeParse({
    id: formData.get("id"),
    dataEntregue: formData.get("dataEntregue"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.sessao.update({
    where: { id: parsed.data.id },
    data: { status: "entregue", dataEntregue: parsed.data.dataEntregue },
  });

  revalidatePath("/financeiro/planos");
  revalidatePath("/analise");
  return { error: null };
}

export async function marcarSessaoPerdida(formData: FormData) {
  const id = z.string().trim().min(1).parse(formData.get("id"));

  await prisma.sessao.update({
    where: { id },
    data: { status: "perdida" },
  });

  revalidatePath("/financeiro/planos");
  revalidatePath("/analise");
}

const marcarPostergadaSchema = z.object({
  id: z.string().trim().min(1),
  novaDataPrevista: z.coerce.date({ error: "Informe uma nova data válida." }),
});

export async function marcarSessaoPostergada(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = marcarPostergadaSchema.safeParse({
    id: formData.get("id"),
    novaDataPrevista: formData.get("novaDataPrevista"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.sessao.update({
    where: { id: parsed.data.id },
    data: { status: "postergada", dataPrevista: parsed.data.novaDataPrevista },
  });

  revalidatePath("/financeiro/planos");
  revalidatePath("/analise");
  return { error: null };
}
