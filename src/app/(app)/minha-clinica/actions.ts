"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, criarSessao, lerSessao, type ActionState } from "@/lib/auth";
import type { ModulosAtivos } from "@/lib/modulos";

export type { ActionState };

const editarClinicaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da clínica."),
});

export const editarClinica = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = editarClinicaSchema.safeParse({ nome: formData.get("nome") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.clinica.update({
    where: { id: ctx.clinicaId },
    data: { nome: parsed.data.nome },
  });

  // O nome da clínica fica denormalizado na sessão (evita uma consulta em
  // toda página) — reemitir o cookie mantém a sessão atual em dia.
  const sessao = await lerSessao();
  if (sessao) {
    await criarSessao({ ...sessao, clinicaNome: parsed.data.nome });
  }

  revalidatePath("/minha-clinica");
  return { error: null };
});

/**
 * Modo Simples: liga/desliga os módulos avançados opcionais da clínica.
 * Nunca apaga dado nenhum — só controla o que aparece para criar.
 */
export const atualizarModulosAtivos = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const modulosAtivos: ModulosAtivos = {
    planos: formData.get("planos") === "on",
    protocolo: formData.get("protocolo") === "on",
    indicacoes: formData.get("indicacoes") === "on",
  };

  await prisma.clinica.update({
    where: { id: ctx.clinicaId },
    data: { modulosAtivos },
  });

  revalidatePath("/minha-clinica");
  revalidatePath("/clientes");
  revalidatePath("/clientes/planos");
  revalidatePath("/produtos");
  return { error: null };
});
