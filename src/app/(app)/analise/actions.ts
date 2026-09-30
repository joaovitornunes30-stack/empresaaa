"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { lerSessao, type ActionState } from "@/lib/auth";
import { comSessaoAba } from "@/lib/permissoes";
import { runWithTenant } from "@/lib/tenant-context";

export type { ActionState };

const metaDoMesSchema = z.object({
  mesReferencia: z.string().trim().regex(/^\d{4}-\d{2}$/, "Mês inválido."),
  valorMeta: z.coerce.number().positive("Valor deve ser maior que zero."),
});

export const definirMetaDoMes = comSessaoAba("analise", async (ctx, _prevState, formData) => {
  const parsed = metaDoMesSchema.safeParse({
    mesReferencia: formData.get("mesReferencia"),
    valorMeta: formData.get("valorMeta"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { mesReferencia, valorMeta } = parsed.data;

  await prisma.metaDoMes.upsert({
    where: { clinicaId_mesReferencia: { clinicaId: ctx.clinicaId, mesReferencia } },
    create: { mesReferencia, valorMeta, clinicaId: ctx.clinicaId },
    update: { valorMeta },
  });

  revalidatePath("/analise");
  return { error: null };
});

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

export const registrarMovimentoEstoque = comSessaoAba("analise", async (ctx, _prevState, formData) => {
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

  await prisma.estoqueMovimento.create({ data: { ...parsed.data, clinicaId: ctx.clinicaId } });

  revalidatePath("/analise");
  return { error: null };
});

/**
 * Só o consultor escreve uma anotação — por isso não usa comSessaoAba, que
 * bloqueia incondicionalmente qualquer mutação de um consultor.
 */
export async function criarAnotacaoConsultor(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  if (sessao.papel !== "consultor") {
    return { error: "Só o consultor pode adicionar uma anotação." };
  }

  const texto = String(formData.get("texto") || "").trim();
  if (!texto) {
    return { error: "Escreva algo antes de salvar." };
  }

  return runWithTenant(sessao, async () => {
    await prisma.anotacaoConsultor.create({
      data: { texto, autorId: sessao.usuarioId, clinicaId: sessao.clinicaId },
    });

    revalidatePath("/analise");
    return { error: null };
  });
}

/**
 * Dono e consultor podem marcar (ou reabrir) uma anotação como resolvida —
 * por isso não usa comSessaoSimplesAba, que bloqueia incondicionalmente
 * qualquer mutação de um consultor.
 */
export async function marcarAnotacaoConsultorResolvida(formData: FormData): Promise<void> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  if (sessao.papel !== "dono" && sessao.papel !== "consultor") {
    throw new Error("Você não tem permissão para esta ação.");
  }

  const id = String(formData.get("id") || "");
  const resolvida = formData.get("resolvida") === "true";
  if (!id) throw new Error("Anotação inválida.");

  await runWithTenant(sessao, async () => {
    await prisma.anotacaoConsultor.update({ where: { id }, data: { resolvida } });
    revalidatePath("/analise");
  });
}
