import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * O IP real do cliente, a partir dos cabeçalhos que o proxy/CDN da
 * hospedagem injeta (x-forwarded-for, com o IP do cliente primeiro) — Next
 * Server Actions não expõem isso diretamente como request.ip. Sem proxy na
 * frente (ex: rodando direto), cai no valor fixo abaixo, que ainda assim
 * mantém o rate limit por e-mail funcionando normalmente.
 */
export async function obterIpCliente(): Promise<string> {
  const store = await headers();
  const encaminhado = store.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return store.get("x-real-ip") ?? "desconhecido";
}

const JANELA_MINUTOS = 15;
const LIMITE_TENTATIVAS = 5;
const LIMPEZA_HORAS = 24;

/**
 * Limite de tentativas de login por chave ("email:<email>" ou
 * "ip:<endereço IP>") — usado para travar tanto um e-mail específico sendo
 * atacado quanto um IP tentando várias contas. TentativaLoginFalha não é um
 * modelo isolado por clínica (ver lib/prisma.ts): as tentativas acontecem
 * ANTES de qualquer sessão existir, então não há contexto de tenant ainda.
 */
export async function estaBloqueadoPorTentativas(chave: string): Promise<boolean> {
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000);
  const quantidade = await prisma.tentativaLoginFalha.count({
    where: { chave, criadoEm: { gte: desde } },
  });
  return quantidade >= LIMITE_TENTATIVAS;
}

/**
 * Registra uma tentativa falha e aproveita a escrita para apagar entradas
 * antigas da MESMA chave (sem tarefa agendada neste app, a tabela nunca
 * cresce sem limite porque cada tentativa nova já limpa o que passou da
 * janela de limpeza).
 */
export async function registrarTentativaFalha(chave: string): Promise<void> {
  const limpezaAntes = new Date(Date.now() - LIMPEZA_HORAS * 60 * 60 * 1000);
  await prisma.tentativaLoginFalha.deleteMany({ where: { chave, criadoEm: { lt: limpezaAntes } } });
  await prisma.tentativaLoginFalha.create({ data: { chave } });
}

export const MENSAGEM_BLOQUEIO = `Muitas tentativas de login. Tente novamente em alguns minutos.`;
