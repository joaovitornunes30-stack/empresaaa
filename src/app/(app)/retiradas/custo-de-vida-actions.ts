"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { comSessao, type ActionState } from "@/lib/auth";
import { salvarMeuCustoDeVida } from "@/lib/custo-de-vida";

export type { ActionState };

const numeroOpcional = z.coerce.number().min(0, "Valor não pode ser negativo.").optional();

const custoDeVidaSchema = z.object({
  preciso: z.coerce.number().positive("Informe quanto você precisa por mês."),
  quero: z.coerce.number().positive("Informe sua meta de renda por mês."),
  moradia: numeroOpcional,
  gastosBasicos: numeroOpcional,
  cartao: numeroOpcional,
  outros: numeroOpcional,
  ativo: z.boolean(),
});

/**
 * Só o próprio dono salva o próprio custo de vida — salvarMeuCustoDeVida
 * nem aceita um usuarioId do chamador, lê sempre da sessão ativa (ver
 * lib/custo-de-vida.ts).
 */
export const salvarCustoDeVida = comSessao(["dono"], async (_ctx, _prevState, formData) => {
  const parsed = custoDeVidaSchema.safeParse({
    preciso: formData.get("preciso"),
    quero: formData.get("quero"),
    moradia: formData.get("moradia") || undefined,
    gastosBasicos: formData.get("gastosBasicos") || undefined,
    cartao: formData.get("cartao") || undefined,
    outros: formData.get("outros") || undefined,
    ativo: formData.get("ativo") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { preciso, quero, moradia, gastosBasicos, cartao, outros, ativo } = parsed.data;

  await salvarMeuCustoDeVida({
    preciso,
    quero,
    moradia: moradia ?? null,
    gastosBasicos: gastosBasicos ?? null,
    cartao: cartao ?? null,
    outros: outros ?? null,
    ativo,
  });

  revalidatePath("/retiradas");
  revalidatePath("/analise");
  return { error: null };
});
