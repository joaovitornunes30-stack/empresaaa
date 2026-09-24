"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { gerarDatasPrevistas } from "@/lib/planos";
import { comSessao, comSessaoSimples, type ActionState } from "@/lib/auth";

export type { ActionState };

const itemPlanoSchema = z.object({
  produtoId: z.string().trim().min(1),
  quantidadeSessoes: z.coerce.number().int().min(1),
  valorItem: z.coerce.number().positive(),
  intervaloDias: z.coerce.number().int().positive(),
});

const criarPlanoSchema = z.object({
  nome: z.string().trim().min(1, "Informe um nome para o plano."),
  clienteId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  dataVenda: z.coerce.date({ error: "Informe uma data válida." }),
  itensJson: z.string().min(1, "Adicione ao menos um produto/serviço."),
});

export const criarPlano = comSessao(["dono", "equipe"], async (ctx, _prevState, formData) => {
  const parsed = criarPlanoSchema.safeParse({
    nome: formData.get("nome"),
    clienteId: formData.get("clienteId") || undefined,
    dataVenda: formData.get("dataVenda"),
    itensJson: formData.get("itensJson"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let itensBrutos: unknown;
  try {
    itensBrutos = JSON.parse(parsed.data.itensJson);
  } catch {
    return { error: "Itens do plano inválidos." };
  }

  const parsedItens = z
    .array(itemPlanoSchema)
    .min(1, "Adicione ao menos um produto/serviço.")
    .safeParse(itensBrutos);

  if (!parsedItens.success) {
    return {
      error: parsedItens.error.issues[0]?.message ?? "Verifique os produtos adicionados ao plano.",
    };
  }

  const { nome, clienteId, dataVenda } = parsed.data;
  const itens = parsedItens.data;
  const valorTotal = itens.reduce((total, item) => total + item.valorItem, 0);

  await prisma.$transaction(async (tx) => {
    const plano = await tx.plano.create({
      data: { nome, clienteId, dataVenda, valorTotal, clinicaId: ctx.clinicaId },
    });

    for (const item of itens) {
      const planoItem = await tx.planoItem.create({
        data: {
          planoId: plano.id,
          produtoId: item.produtoId,
          quantidadeSessoes: item.quantidadeSessoes,
          valorItem: item.valorItem,
          intervaloDias: item.intervaloDias,
        },
      });

      const datasPrevistas = gerarDatasPrevistas(dataVenda, item.quantidadeSessoes, item.intervaloDias);
      await tx.sessao.createMany({
        data: datasPrevistas.map((dataPrevista, index) => ({
          planoItemId: planoItem.id,
          numero: index + 1,
          dataPrevista,
          status: "pendente",
        })),
      });
    }

    // Reflete a venda do plano no fluxo de caixa como qualquer outra
    // entrada — o valor total entra de uma vez; o reconhecimento por sessão
    // é calculado à parte (ver src/lib/planos.ts).
    await tx.entradaSaida.create({
      data: {
        tipo: "entrada",
        categoria: "Vendas",
        valor: valorTotal,
        data: dataVenda,
        clienteId,
        descricao: `Plano: ${nome}`,
        clinicaId: ctx.clinicaId,
      },
    });
  });

  revalidatePath("/financeiro");
  revalidatePath("/clientes/planos");
  revalidatePath("/analise");
  revalidatePath("/clientes");
  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
});

const marcarEntregueSchema = z.object({
  id: z.string().trim().min(1),
  dataEntregue: z.coerce.date({ error: "Informe uma data válida." }),
});

// Sessao não tem clinicaId próprio (isolada transitivamente via
// PlanoItem -> Plano) — a extensão do Prisma não a filtra automaticamente,
// então cada update aqui restringe explicitamente pela clínica do plano.
export const marcarSessaoEntregue = comSessao(["dono", "equipe"], async (ctx, _prevState, formData) => {
  const parsed = marcarEntregueSchema.safeParse({
    id: formData.get("id"),
    dataEntregue: formData.get("dataEntregue"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { count } = await prisma.sessao.updateMany({
    where: { id: parsed.data.id, planoItem: { plano: { clinicaId: ctx.clinicaId } } },
    data: { status: "entregue", dataEntregue: parsed.data.dataEntregue },
  });
  if (count === 0) return { error: "Sessão não encontrada." };

  revalidatePath("/clientes/planos");
  revalidatePath("/analise");
  return { error: null };
});

export const marcarSessaoPerdida = comSessaoSimples(["dono", "equipe"], async (ctx, formData) => {
  const id = z.string().trim().min(1).parse(formData.get("id"));

  await prisma.sessao.updateMany({
    where: { id, planoItem: { plano: { clinicaId: ctx.clinicaId } } },
    data: { status: "perdida" },
  });

  revalidatePath("/clientes/planos");
  revalidatePath("/analise");
});

const marcarPostergadaSchema = z.object({
  id: z.string().trim().min(1),
  novaDataPrevista: z.coerce.date({ error: "Informe uma nova data válida." }),
});

export const marcarSessaoPostergada = comSessao(["dono", "equipe"], async (ctx, _prevState, formData) => {
  const parsed = marcarPostergadaSchema.safeParse({
    id: formData.get("id"),
    novaDataPrevista: formData.get("novaDataPrevista"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { count } = await prisma.sessao.updateMany({
    where: { id: parsed.data.id, planoItem: { plano: { clinicaId: ctx.clinicaId } } },
    data: { status: "postergada", dataPrevista: parsed.data.novaDataPrevista },
  });
  if (count === 0) return { error: "Sessão não encontrada." };

  revalidatePath("/clientes/planos");
  revalidatePath("/analise");
  return { error: null };
});
