"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adicionarMeses, calcularValoresParcelas } from "@/lib/financeiro";

export type ActionState = {
  error: string | null;
};

const entradaSaidaSchema = z
  .object({
    tipo: z.enum(["entrada", "saida"], { error: "Selecione o tipo." }),
    categoria: z.string().trim().min(1, "Informe a categoria."),
    valor: z.coerce.number().positive("Valor deve ser maior que zero."),
    data: z.coerce.date({ error: "Informe uma data válida." }),
    descricao: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    parcelado: z.coerce.boolean().optional(),
    numeroParcelas: z.coerce.number().int().optional(),
  })
  .refine(
    (data) => !data.parcelado || (data.numeroParcelas ?? 0) >= 2,
    {
      message: "Informe ao menos 2 parcelas.",
      path: ["numeroParcelas"],
    },
  );

export async function criarEntradaSaida(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = entradaSaidaSchema.safeParse({
    tipo: formData.get("tipo"),
    categoria: formData.get("categoria"),
    valor: formData.get("valor"),
    data: formData.get("data"),
    descricao: formData.get("descricao"),
    parcelado: formData.get("parcelado") === "on",
    numeroParcelas: formData.get("numeroParcelas") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { tipo, categoria, valor, data, descricao, parcelado, numeroParcelas } =
    parsed.data;

  await prisma.entradaSaida.create({
    data: {
      tipo,
      categoria,
      valor,
      data,
      descricao,
      ...(parcelado && numeroParcelas
        ? {
            parcelas: {
              create: calcularValoresParcelas(valor, numeroParcelas).map(
                (valorParcela, index) => ({
                  numeroParcela: index + 1,
                  valor: valorParcela,
                  dataVencimento: adicionarMeses(data, index),
                  status: "pendente",
                }),
              ),
            },
          }
        : {}),
    },
  });

  revalidatePath("/financeiro");
  return { error: null };
}

const dividaSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  dataVencimento: z.coerce.date({ error: "Informe uma data válida." }),
  numeroParcelas: z.coerce
    .number()
    .int()
    .positive("Número de parcelas deve ser maior que zero.")
    .optional(),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function criarDivida(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = dividaSchema.safeParse({
    valor: formData.get("valor"),
    dataVencimento: formData.get("dataVencimento"),
    numeroParcelas: formData.get("numeroParcelas") || undefined,
    descricao: formData.get("descricao"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.divida.create({ data: parsed.data });

  revalidatePath("/financeiro");
  return { error: null };
}

export async function marcarParcelaPaga(formData: FormData) {
  const id = z.string().trim().min(1).parse(formData.get("id"));

  await prisma.parcela.update({
    where: { id },
    data: { status: "pago" },
  });

  revalidatePath("/financeiro");
}
