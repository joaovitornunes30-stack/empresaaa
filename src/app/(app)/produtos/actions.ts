"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, type ActionState } from "@/lib/auth";

export type { ActionState };

const protocoloItemSchema = z.object({
  materialId: z.string().trim().min(1),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero."),
});

const produtoSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome do produto."),
    precoVenda: z.coerce
      .number()
      .positive("Valor por hora deve ser maior que zero."),
    custoMedioMaterial: z.coerce
      .number()
      .min(0, "Custo médio não pode ser negativo."),
    duracaoMinutos: z.coerce
      .number()
      .int("Duração deve ser um número inteiro de minutos.")
      .positive("Duração deve ser maior que zero."),
    comissaoTipo: z.enum(["percentual", "fixo"], {
      error: "Selecione o tipo de comissão.",
    }),
    comissaoValor: z.coerce.number().min(0, "Comissão não pode ser negativa."),
    divisorCustoEspaco: z.coerce
      .number()
      .int("Divisor de custo de espaço deve ser um número inteiro.")
      .min(1, "Divisor de custo de espaço deve ser no mínimo 1."),
    perfilTributarioId: z
      .string()
      .trim()
      .min(1, "Selecione um perfil tributário."),
    protocoloItensJson: z
      .string()
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine(
    (data) => data.comissaoTipo !== "percentual" || data.comissaoValor <= 100,
    {
      message: "Comissão percentual não pode ser maior que 100%.",
      path: ["comissaoValor"],
    },
  );

export const criarProduto = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    precoVenda: formData.get("precoVenda"),
    custoMedioMaterial: formData.get("custoMedioMaterial"),
    duracaoMinutos: formData.get("duracaoMinutos"),
    comissaoTipo: formData.get("comissaoTipo"),
    comissaoValor: formData.get("comissaoValor"),
    divisorCustoEspaco: formData.get("divisorCustoEspaco"),
    perfilTributarioId: formData.get("perfilTributarioId"),
    protocoloItensJson: formData.get("protocoloItensJson") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { protocoloItensJson, custoMedioMaterial: custoInformado, ...data } =
    parsed.data;

  let itensProtocolo: { materialId: string; quantidade: number }[] = [];
  if (protocoloItensJson) {
    let itensBrutos: unknown;
    try {
      itensBrutos = JSON.parse(protocoloItensJson);
    } catch {
      return { error: "Itens do protocolo inválidos." };
    }

    const parsedItens = z
      .array(protocoloItemSchema)
      .min(1, "Adicione ao menos um material ao protocolo.")
      .safeParse(itensBrutos);

    if (!parsedItens.success) {
      return {
        error:
          parsedItens.error.issues[0]?.message ??
          "Verifique os materiais adicionados ao protocolo.",
      };
    }

    itensProtocolo = parsedItens.data;
  }

  // Quando o produto é um protocolo, o custo médio de material é sempre
  // calculado como a soma de (custo de cada material x quantidade) — o
  // valor digitado no formulário é ignorado.
  let custoMedioMaterial = custoInformado;

  if (itensProtocolo.length > 0) {
    const materiaisIds = [...new Set(itensProtocolo.map((item) => item.materialId))];
    const materiais = await prisma.produto.findMany({
      where: { id: { in: materiaisIds } },
      select: {
        id: true,
        custoMedioMaterial: true,
        _count: { select: { protocoloItens: true } },
      },
    });

    if (materiais.length !== materiaisIds.length) {
      return { error: "Um ou mais materiais selecionados não foram encontrados." };
    }
    if (materiais.some((material) => material._count.protocoloItens > 0)) {
      return { error: "Um protocolo não pode usar outro protocolo como material." };
    }

    const custoPorMaterial = new Map(
      materiais.map((material) => [material.id, material.custoMedioMaterial]),
    );
    custoMedioMaterial = itensProtocolo.reduce(
      (total, item) =>
        total + (custoPorMaterial.get(item.materialId) ?? 0) * item.quantidade,
      0,
    );
  }

  await prisma.produto.create({
    data: {
      ...data,
      custoMedioMaterial,
      clinicaId: ctx.clinicaId,
      ...(itensProtocolo.length > 0
        ? {
            protocoloItens: {
              create: itensProtocolo.map((item) => ({
                materialId: item.materialId,
                quantidade: item.quantidade,
              })),
            },
          }
        : {}),
    },
  });

  revalidatePath("/produtos");
  return { error: null };
});

const perfilSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do perfil."),
  aliquota: z.coerce
    .number()
    .min(0, "Alíquota não pode ser negativa.")
    .max(100, "Alíquota não pode ser maior que 100%."),
});

export const criarPerfilTributario = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = perfilSchema.safeParse({
    nome: formData.get("nome"),
    aliquota: formData.get("aliquota"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.perfilTributario.create({ data: { ...parsed.data, clinicaId: ctx.clinicaId } });

  revalidatePath("/produtos");
  return { error: null };
});

const editarPerfilSchema = perfilSchema.extend({
  id: z.string().trim().min(1),
});

export const editarPerfilTributario = comSessao(["dono"], async (_ctx, _prevState, formData) => {
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
});
