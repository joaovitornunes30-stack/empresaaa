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
    nomePrestador: z
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
    nomePrestador: formData.get("nomePrestador"),
    parcelado: formData.get("parcelado") === "on",
    numeroParcelas: formData.get("numeroParcelas") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const {
    tipo,
    categoria,
    valor,
    data,
    descricao,
    nomePrestador,
    parcelado,
    numeroParcelas,
  } = parsed.data;

  await prisma.entradaSaida.create({
    data: {
      tipo,
      categoria,
      valor,
      data,
      descricao,
      nomePrestador: categoria === "Prestador de Serviço" ? nomePrestador : undefined,
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

function gerarParcelasFixas(numeroParcelas: number, valorParcela: number, inicio: Date) {
  return Array.from({ length: numeroParcelas }, (_, index) => ({
    numeroParcela: index + 1,
    valor: valorParcela,
    dataVencimento: adicionarMeses(inicio, index),
    status: "pendente",
  }));
}

const dividaSchema = z
  .object({
    valor: z.coerce.number().positive("Valor deve ser maior que zero."),
    dataVencimento: z.coerce.date({ error: "Informe uma data válida." }),
    numeroParcelas: z.coerce
      .number()
      .int()
      .positive("Número de parcelas deve ser maior que zero.")
      .optional(),
    valorParcela: z.coerce
      .number()
      .positive("Valor da parcela deve ser maior que zero.")
      .optional(),
    descricao: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    status: z.enum(["em_pagamento", "nao_estruturada"]).default("nao_estruturada"),
  })
  .refine((data) => data.status !== "em_pagamento" || !!data.numeroParcelas, {
    message: "Informe o número de parcelas.",
    path: ["numeroParcelas"],
  });

export async function criarDivida(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = dividaSchema.safeParse({
    valor: formData.get("valor"),
    dataVencimento: formData.get("dataVencimento"),
    numeroParcelas: formData.get("numeroParcelas") || undefined,
    valorParcela: formData.get("valorParcela") || undefined,
    descricao: formData.get("descricao"),
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { valor, dataVencimento, numeroParcelas, valorParcela, descricao, status } =
    parsed.data;

  if (status === "em_pagamento" && numeroParcelas) {
    const valorCadaParcela =
      valorParcela ?? Math.round((valor / numeroParcelas) * 100) / 100;
    const hoje = new Date();

    await prisma.divida.create({
      data: {
        valor,
        dataVencimento,
        numeroParcelas,
        descricao,
        status,
        valorParcela: valorCadaParcela,
        entradaSaida: {
          create: {
            tipo: "saida",
            categoria: "Dívida",
            valor: valorCadaParcela * numeroParcelas,
            data: hoje,
            descricao,
            parcelas: {
              create: gerarParcelasFixas(numeroParcelas, valorCadaParcela, hoje),
            },
          },
        },
      },
    });
  } else {
    await prisma.divida.create({
      data: { valor, dataVencimento, numeroParcelas, descricao, status },
    });
  }

  revalidatePath("/financeiro");
  return { error: null };
}

const ativarPagamentoSchema = z.object({
  id: z.string().trim().min(1),
  numeroParcelas: z.coerce
    .number()
    .int()
    .positive("Número de parcelas deve ser maior que zero."),
  valorParcela: z.coerce
    .number()
    .positive("Valor da parcela deve ser maior que zero.")
    .optional(),
});

export async function ativarPagamentoDivida(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ativarPagamentoSchema.safeParse({
    id: formData.get("id"),
    numeroParcelas: formData.get("numeroParcelas"),
    valorParcela: formData.get("valorParcela") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, numeroParcelas, valorParcela } = parsed.data;

  const divida = await prisma.divida.findUnique({ where: { id } });
  if (!divida) return { error: "Dívida não encontrada." };
  if (divida.status === "em_pagamento") return { error: null };

  const valorCadaParcela =
    valorParcela ?? Math.round((divida.valor / numeroParcelas) * 100) / 100;
  const hoje = new Date();

  await prisma.divida.update({
    where: { id },
    data: {
      status: "em_pagamento",
      numeroParcelas,
      valorParcela: valorCadaParcela,
      entradaSaida: {
        create: {
          tipo: "saida",
          categoria: "Dívida",
          valor: valorCadaParcela * numeroParcelas,
          data: hoje,
          descricao: divida.descricao,
          parcelas: {
            create: gerarParcelasFixas(numeroParcelas, valorCadaParcela, hoje),
          },
        },
      },
    },
  });

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
