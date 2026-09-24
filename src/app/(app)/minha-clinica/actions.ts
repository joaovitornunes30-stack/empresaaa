"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, criarSessao, lerSessao, type ActionState } from "@/lib/auth";

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
