"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encerrarSessao, lerSessao, criarSessao, type ActionState } from "@/lib/auth";
import { enviarEmail } from "@/lib/email";

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

/**
 * Consultor troca a clínica ativa entre as que possui em ConsultorAcesso —
 * cada troca também grava um novo registro (o "ao acessar, gravar um
 * registro em ConsultorAcesso" do modo Consultor).
 */
export async function trocarClinicaConsultor(clinicaId: string) {
  const sessao = await lerSessao();
  if (!sessao || sessao.papel !== "consultor") redirect("/login");

  const acesso = await prisma.consultorAcesso.findFirst({
    where: { usuarioId: sessao.usuarioId, clinicaId },
    include: { clinica: { select: { nome: true } } },
  });
  if (!acesso) {
    throw new Error("Este consultor não tem acesso a esta clínica.");
  }

  await prisma.consultorAcesso.create({
    data: { usuarioId: sessao.usuarioId, clinicaId },
  });

  await criarSessao({
    ...sessao,
    clinicaId,
    clinicaNome: acesso.clinica.nome,
  });

  redirect("/home");
}

export async function clinicasDoConsultor() {
  const sessao = await lerSessao();
  if (!sessao || sessao.papel !== "consultor") return [];

  const acessos = await prisma.consultorAcesso.findMany({
    where: { usuarioId: sessao.usuarioId },
    distinct: ["clinicaId"],
    include: { clinica: { select: { id: true, nome: true } } },
  });
  return acessos.map((a) => a.clinica);
}

export async function bannerConsultorParaClinica(clinicaId: string) {
  // ConsultorAcesso não é isolado por clínica pela extensão do Prisma (ver
  // MODELOS_COM_CLINICA em lib/prisma.ts) — filtra explicitamente aqui.
  return prisma.consultorAcesso.findFirst({
    where: { clinicaId },
    orderBy: { dataAcesso: "desc" },
    include: { usuario: { select: { nome: true } } },
  });
}

const relatoSchema = z.object({
  mensagem: z.string().trim().min(1, "Descreva o problema.").max(2000, "Mensagem muito longa."),
  tela: z.string().trim().max(200).optional(),
});

/**
 * "Relatar problema" (menu da conta) — qualquer papel autenticado pode
 * enviar, inclusive consultor e adminPlataforma. RelatoProblema não é
 * isolado por clínica (ver MODELOS_COM_CLINICA em lib/prisma.ts): a própria
 * linha já guarda usuarioId/clinicaId como dado descritivo, não como algo a
 * proteger de outras clínicas lendo de volta — ninguém lê isso pela
 * aplicação, só quem administra o banco diretamente (ou recebe o e-mail).
 */
export async function relatarProblema(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  const parsed = relatoSchema.safeParse({
    mensagem: formData.get("mensagem"),
    tela: formData.get("tela"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.relatoProblema.create({
    data: {
      usuarioId: sessao.usuarioId,
      usuarioNome: sessao.nome,
      usuarioEmail: sessao.email,
      clinicaId: sessao.papel === "adminPlataforma" ? null : sessao.clinicaId,
      clinicaNome: sessao.papel === "adminPlataforma" ? null : sessao.clinicaNome,
      tela: parsed.data.tela || null,
      mensagem: parsed.data.mensagem,
    },
  });

  const emailAdmin = process.env.EMAIL_ADMIN;
  if (emailAdmin) {
    await enviarEmail({
      para: emailAdmin,
      assunto: "Aivy — novo problema relatado",
      textoPlano: `Usuário: ${sessao.nome} (${sessao.email})\nClínica: ${sessao.clinicaNome || "—"}\nTela: ${parsed.data.tela || "—"}\n\n${parsed.data.mensagem}`,
      html: `<p><strong>Usuário:</strong> ${sessao.nome} (${sessao.email})</p><p><strong>Clínica:</strong> ${sessao.clinicaNome || "—"}</p><p><strong>Tela:</strong> ${parsed.data.tela || "—"}</p><p>${parsed.data.mensagem}</p>`,
    });
  }

  return { error: null };
}
