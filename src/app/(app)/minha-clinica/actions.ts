"use server";

import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, criarSessao, lerSessao, type ActionState } from "@/lib/auth";
import type { ModulosAtivos } from "@/lib/modulos";
import {
  cnpjValido,
  ehTipoClinica,
  somenteDigitos,
  LOGO_TAMANHO_MAXIMO_BYTES,
} from "@/lib/clinica-cadastro";

export type { ActionState };

const enderecoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const editarClinicaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da clínica."),
  tipoClinica: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || ehTipoClinica(v), "Tipo de clínica inválido."),
  cnpj: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? somenteDigitos(v) : null))
    .refine((v) => v === null || cnpjValido(v), "CNPJ inválido — confira os números digitados."),
  cep: enderecoOpcional,
  logradouro: enderecoOpcional,
  numero: enderecoOpcional,
  complemento: enderecoOpcional,
  bairro: enderecoOpcional,
  cidade: enderecoOpcional,
  uf: enderecoOpcional,
});

export const editarClinica = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = editarClinicaSchema.safeParse({
    nome: formData.get("nome"),
    tipoClinica: formData.get("tipoClinica"),
    cnpj: formData.get("cnpj"),
    cep: formData.get("cep"),
    logradouro: formData.get("logradouro"),
    numero: formData.get("numero"),
    complemento: formData.get("complemento"),
    bairro: formData.get("bairro"),
    cidade: formData.get("cidade"),
    uf: formData.get("uf"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, ...resto } = parsed.data;

  await prisma.clinica.update({
    where: { id: ctx.clinicaId },
    data: { nome, ...resto },
  });

  // O nome da clínica fica denormalizado na sessão (evita uma consulta em
  // toda página) — reemitir o cookie mantém a sessão atual em dia.
  const sessao = await lerSessao();
  if (sessao) {
    await criarSessao({ ...sessao, clinicaNome: nome });
  }

  revalidatePath("/minha-clinica");
  revalidatePath("/home");
  return { error: null };
});

const PASTA_LOGOS = path.join(process.cwd(), "public", "uploads", "logos");

function assinaturaValida(bytes: Uint8Array, tipo: string): boolean {
  if (tipo === "image/png") {
    const assinatura = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return assinatura.every((byte, i) => bytes[i] === byte);
  }
  if (tipo === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (tipo === "image/svg+xml") {
    const texto = Buffer.from(bytes).toString("utf-8").trimStart().toLowerCase();
    const comecaComSvg = texto.startsWith("<?xml") || texto.startsWith("<svg");
    // Defesa mínima contra SVG malicioso (o arquivo fica acessível
    // publicamente depois de salvo) — nunca aceita script embutido.
    const temConteudoPerigoso = /<script|on\w+\s*=|javascript:/i.test(texto);
    return comecaComSvg && !temConteudoPerigoso;
  }
  return false;
}

/**
 * Nunca confia só na extensão/Content-Type declarado pelo navegador — lê os
 * primeiros bytes do arquivo de verdade para decidir o tipo real.
 */
function detectarTipoReal(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/svg+xml" | null {
  if (assinaturaValida(bytes, "image/png")) return "image/png";
  if (assinaturaValida(bytes, "image/jpeg")) return "image/jpeg";
  if (assinaturaValida(bytes, "image/svg+xml")) return "image/svg+xml";
  return null;
}

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
};

export const salvarLogoClinica = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const arquivo = formData.get("logo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo de imagem." };
  }
  if (arquivo.size > LOGO_TAMANHO_MAXIMO_BYTES) {
    return { error: "O arquivo deve ter no máximo 1 MB." };
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipoReal = detectarTipoReal(bytes);
  if (!tipoReal) {
    return { error: "Formato inválido. Envie um arquivo PNG, JPG ou SVG." };
  }

  await mkdir(PASTA_LOGOS, { recursive: true });

  const clinicaAtual = await prisma.clinica.findUniqueOrThrow({ where: { id: ctx.clinicaId }, select: { logoUrl: true } });

  const nomeArquivo = `${ctx.clinicaId}-${Date.now()}.${EXTENSAO_POR_TIPO[tipoReal]}`;
  await writeFile(path.join(PASTA_LOGOS, nomeArquivo), bytes);
  const logoUrl = `/uploads/logos/${nomeArquivo}`;

  await prisma.clinica.update({ where: { id: ctx.clinicaId }, data: { logoUrl } });

  if (clinicaAtual.logoUrl) {
    await unlink(path.join(process.cwd(), "public", clinicaAtual.logoUrl)).catch(() => {});
  }

  revalidatePath("/minha-clinica");
  revalidatePath("/home");
  return { error: null };
});

export const removerLogoClinica = comSessao(["dono"], async (ctx, _prevState, _formData) => {
  const clinicaAtual = await prisma.clinica.findUniqueOrThrow({ where: { id: ctx.clinicaId }, select: { logoUrl: true } });

  await prisma.clinica.update({ where: { id: ctx.clinicaId }, data: { logoUrl: null } });

  if (clinicaAtual.logoUrl) {
    await unlink(path.join(process.cwd(), "public", clinicaAtual.logoUrl)).catch(() => {});
  }

  revalidatePath("/minha-clinica");
  revalidatePath("/home");
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
