"use server";

import { z } from "zod";
import { solicitarRecuperacaoSenha } from "@/lib/recuperacao-senha";
import { estaBloqueadoPorTentativas, registrarTentativaFalha, obterIpCliente, MENSAGEM_BLOQUEIO } from "@/lib/rate-limit";

export type ActionState = { error: string | null; enviado: boolean };

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
});

export async function solicitarRedefinicao(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", enviado: false };
  }

  const { email } = parsed.data;

  // Limite de pedidos por e-mail e por IP — evita que alguém force o envio
  // repetido de e-mails para a mesma pessoa (ou varra uma lista de e-mails).
  const ip = await obterIpCliente();
  const chaveEmail = `resetreq:email:${email}`;
  const chaveIp = `resetreq:ip:${ip}`;
  if ((await estaBloqueadoPorTentativas(chaveEmail)) || (await estaBloqueadoPorTentativas(chaveIp))) {
    return { error: MENSAGEM_BLOQUEIO, enviado: false };
  }
  await registrarTentativaFalha(chaveEmail);
  await registrarTentativaFalha(chaveIp);

  await solicitarRecuperacaoSenha(email);

  return { error: null, enviado: true };
}
