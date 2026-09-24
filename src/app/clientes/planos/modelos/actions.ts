"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = {
  error: string | null;
};

const itemModeloSchema = z.object({
  produtoId: z.string().trim().min(1),
  quantidadeSessoes: z.coerce.number().int().min(1),
  valorItem: z.coerce.number().positive(),
  intervaloDias: z.coerce.number().int().positive(),
});

const criarPlanoModeloSchema = z.object({
  nome: z.string().trim().min(1, "Informe um nome para o modelo."),
  itensJson: z.string().min(1, "Adicione ao menos um produto/serviço."),
});

export async function criarPlanoModelo(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = criarPlanoModeloSchema.safeParse({
    nome: formData.get("nome"),
    itensJson: formData.get("itensJson"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let itensBrutos: unknown;
  try {
    itensBrutos = JSON.parse(parsed.data.itensJson);
  } catch {
    return { error: "Itens do modelo inválidos." };
  }

  const parsedItens = z
    .array(itemModeloSchema)
    .min(1, "Adicione ao menos um produto/serviço.")
    .safeParse(itensBrutos);

  if (!parsedItens.success) {
    return {
      error: parsedItens.error.issues[0]?.message ?? "Verifique os produtos adicionados ao modelo.",
    };
  }

  const { nome } = parsed.data;

  await prisma.planoModelo.create({
    data: {
      nome,
      itens: {
        create: parsedItens.data.map((item) => ({
          produtoId: item.produtoId,
          quantidadeSessoes: item.quantidadeSessoes,
          valorItem: item.valorItem,
          intervaloDias: item.intervaloDias,
        })),
      },
    },
  });

  revalidatePath("/clientes/planos/modelos");
  revalidatePath("/clientes/planos");
  return { error: null };
}
