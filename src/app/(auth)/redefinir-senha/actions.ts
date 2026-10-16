"use server";

import { z } from "zod";
import { redefinirSenhaComToken } from "@/lib/recuperacao-senha";

export type ActionState = { error: string | null; sucesso: boolean };

const schema = z
  .object({
    token: z.string().min(1),
    novaSenha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export async function redefinirSenha(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }

  const resultado = await redefinirSenhaComToken(parsed.data.token, parsed.data.novaSenha);
  if (!resultado.ok) {
    return { error: resultado.erro, sucesso: false };
  }

  return { error: null, sucesso: true };
}
