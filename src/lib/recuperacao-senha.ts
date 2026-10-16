import { randomBytes, createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/auth";
import { enviarEmail } from "@/lib/email";

const VALIDADE_HORAS = 1;

function hashToken(token: string): string {
  // sha256 (não bcrypt): o token em si já tem 256 bits de entropia aleatória
  // (não é uma senha escolhida por humano), então uma busca por igualdade
  // direta é segura e, diferente de bcrypt, permite localizar a linha pelo
  // hash sem precisar varrer a tabela inteira.
  return createHash("sha256").update(token).digest("hex");
}

async function urlBase(): Promise<string> {
  const store = await headers();
  const host = store.get("host") ?? "localhost:3000";
  const proto = store.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

/**
 * Sempre devolve o mesmo resultado (void), exista ou não o e-mail — quem
 * chama (a action da tela) sempre mostra a mesma mensagem genérica ao
 * usuário, para nunca revelar quais e-mails têm conta no sistema.
 */
export async function solicitarRecuperacaoSenha(email: string): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiraEm = new Date(Date.now() + VALIDADE_HORAS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { usuarioId: usuario.id, tokenHash, expiraEm },
  });

  const link = `${await urlBase()}/redefinir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Redefinir sua senha no Aivy",
    textoPlano: `Olá, ${usuario.nome}.\n\nPara redefinir sua senha no Aivy, acesse o link abaixo (válido por ${VALIDADE_HORAS} hora):\n${link}\n\nSe você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.`,
    html: `<p>Olá, ${usuario.nome}.</p><p>Para redefinir sua senha no Aivy, clique no link abaixo (válido por ${VALIDADE_HORAS} hora):</p><p><a href="${link}">${link}</a></p><p>Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.</p>`,
  });
}

export type ResultadoRedefinicao = { ok: true } | { ok: false; erro: string };

/** Mensagem genérica — nunca diferencia "token não existe" de "token expirado"/"já usado". */
const ERRO_TOKEN_INVALIDO = "Link inválido ou expirado. Solicite uma nova redefinição de senha.";

export async function redefinirSenhaComToken(token: string, novaSenha: string): Promise<ResultadoRedefinicao> {
  if (novaSenha.length < 8) {
    return { ok: false, erro: "A senha deve ter ao menos 8 caracteres." };
  }

  const tokenHash = hashToken(token);
  const registro = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!registro || registro.usadoEm !== null || registro.expiraEm.getTime() < Date.now()) {
    return { ok: false, erro: ERRO_TOKEN_INVALIDO };
  }

  const senhaHash = await hashSenha(novaSenha);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuarioId },
      data: { senhaHash, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usadoEm: new Date() },
    }),
  ]);

  return { ok: true };
}
