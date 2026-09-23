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
    produtoId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    quantidadeVendida: z.coerce
      .number()
      .int("Quantidade vendida deve ser um número inteiro.")
      .positive("Quantidade vendida deve ser maior que zero.")
      .optional(),
    clienteId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    fechadoPor: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    dataProximoRetorno: z.coerce
      .date({ error: "Informe uma data de retorno válida." })
      .optional(),
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
    descricao: formData.get("descricao") || undefined,
    nomePrestador: formData.get("nomePrestador") || undefined,
    produtoId: formData.get("produtoId") || undefined,
    quantidadeVendida: formData.get("quantidadeVendida") || undefined,
    clienteId: formData.get("clienteId") || undefined,
    fechadoPor: formData.get("fechadoPor") || undefined,
    dataProximoRetorno: formData.get("dataProximoRetorno") || undefined,
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
    produtoId,
    quantidadeVendida,
    clienteId,
    fechadoPor,
    dataProximoRetorno,
    parcelado,
    numeroParcelas,
  } = parsed.data;

  const produtoVendidoId = tipo === "entrada" ? produtoId : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.entradaSaida.create({
      data: {
        tipo,
        categoria,
        valor,
        data,
        descricao,
        nomePrestador: categoria === "Prestador de Serviço" ? nomePrestador : undefined,
        produtoId: produtoVendidoId,
        clienteId: tipo === "entrada" ? clienteId : undefined,
        fechadoPor: tipo === "entrada" ? fechadoPor : undefined,
        dataProximoRetorno: tipo === "entrada" ? dataProximoRetorno : undefined,
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

    // Uma venda com produto e quantidade informados baixa o estoque
    // automaticamente — não deve ser lançada de novo na tela de Estoque.
    if (produtoVendidoId && quantidadeVendida) {
      await tx.estoqueMovimento.create({
        data: {
          produtoId: produtoVendidoId,
          tipo: "saida",
          quantidade: quantidadeVendida,
          data,
          descricao: "Venda",
        },
      });
    }
  });

  revalidatePath("/financeiro");
  revalidatePath("/analise");
  revalidatePath("/clientes");
  return { error: null };
}

/**
 * Cada parcela mensal de uma dívida em pagamento vira o seu próprio
 * EntradaSaida (categoria "Dívida"), com valor igual ao valor da parcela
 * (nunca o total da dívida) e exatamente uma Parcela associada — assim ela
 * aparece na listagem apenas no mês do seu vencimento, com o valor certo.
 */
async function gerarParcelasMensaisDaDivida(
  dividaId: string,
  numeroParcelas: number,
  valorParcela: number,
  descricao: string | undefined,
  inicio: Date,
) {
  await prisma.$transaction(
    Array.from({ length: numeroParcelas }, (_, index) => {
      const dataVencimento = adicionarMeses(inicio, index);
      return prisma.entradaSaida.create({
        data: {
          tipo: "saida",
          categoria: "Dívida",
          valor: valorParcela,
          data: dataVencimento,
          descricao,
          dividaId,
          parcelas: {
            create: [
              {
                numeroParcela: index + 1,
                valor: valorParcela,
                dataVencimento,
                status: "pendente",
              },
            ],
          },
        },
      });
    }),
  );
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

    const divida = await prisma.divida.create({
      data: {
        valor,
        dataVencimento,
        numeroParcelas,
        descricao,
        status,
        valorParcela: valorCadaParcela,
      },
    });

    await gerarParcelasMensaisDaDivida(
      divida.id,
      numeroParcelas,
      valorCadaParcela,
      descricao,
      hoje,
    );
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
    },
  });

  await gerarParcelasMensaisDaDivida(
    id,
    numeroParcelas,
    valorCadaParcela,
    divida.descricao ?? undefined,
    hoje,
  );

  revalidatePath("/financeiro");
  return { error: null };
}

const metaLucroSchema = z.object({
  mes: z.string().trim().regex(/^\d{4}-\d{2}$/, "Mês inválido."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
});

export async function definirMetaLucro(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = metaLucroSchema.safeParse({
    mes: formData.get("mes"),
    valor: formData.get("valor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { mes, valor } = parsed.data;

  await prisma.metaLucroMensal.upsert({
    where: { mes },
    create: { mes, valor },
    update: { valor },
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
