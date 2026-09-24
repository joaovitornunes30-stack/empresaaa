"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { encerrarSessao, lerSessao, criarSessao } from "@/lib/auth";

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

  redirect("/analise");
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
