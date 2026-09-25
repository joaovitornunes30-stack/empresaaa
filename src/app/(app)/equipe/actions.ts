"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comSessao, comSessaoSimples, hashSenha, gerarSenhaTemporaria, type ActionState } from "@/lib/auth";

export type { ActionState };

export type ConvidarState = {
  error: string | null;
  convite: { nome: string; email: string; senhaTemporaria: string | null } | null;
};

const permissoesFormShape = {
  acessaProdutos: z.boolean(),
  acessaClientes: z.boolean(),
  acessaFinanceiro: z.boolean(),
  acessaFinanceiroRetiradas: z.boolean(),
  acessaAnalise: z.boolean(),
  acessaEquipe: z.boolean(),
};

/** Checkboxes só chegam no FormData quando marcados ("on") — nunca "off". */
function lerPermissoesFormData(formData: FormData) {
  return {
    acessaProdutos: formData.get("acessaProdutos") === "on",
    acessaClientes: formData.get("acessaClientes") === "on",
    acessaFinanceiro: formData.get("acessaFinanceiro") === "on",
    acessaFinanceiroRetiradas: formData.get("acessaFinanceiroRetiradas") === "on",
    acessaAnalise: formData.get("acessaAnalise") === "on",
    acessaEquipe: formData.get("acessaEquipe") === "on",
  };
}

/** acessaFinanceiroRetiradas só faz sentido (e só é persistido) junto com acessaFinanceiro. */
function normalizarPermissoes<T extends { acessaFinanceiro: boolean; acessaFinanceiroRetiradas: boolean }>(
  permissoes: T,
) {
  return {
    ...permissoes,
    acessaFinanceiroRetiradas: permissoes.acessaFinanceiro && permissoes.acessaFinanceiroRetiradas,
  };
}

const convidarSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  papel: z.enum(["dono", "membro", "consultor"], { error: "Selecione um papel." }),
  cargo: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  ...permissoesFormShape,
});

export const convidarUsuario = comSessao<ConvidarState>(["dono"], async (ctx, _prevState, formData) => {
  const parsed = convidarSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    papel: formData.get("papel"),
    cargo: formData.get("cargo") || undefined,
    ...lerPermissoesFormData(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", convite: null };
  }

  const { nome, email, papel, cargo, ...permissoesBrutas } = parsed.data;
  const existente = await prisma.usuario.findUnique({ where: { email } });

  if (papel === "consultor" && existente?.papel === "consultor") {
    // Consultor já existe (pode já atender outras clínicas) — só concede
    // acesso a esta clínica, sem criar uma conta nova nem gerar senha.
    await prisma.consultorAcesso.create({
      data: { usuarioId: existente.id, clinicaId: ctx.clinicaId },
    });
    revalidatePath("/equipe");
    return { error: null, convite: { nome: existente.nome, email, senhaTemporaria: null } };
  }

  if (existente) {
    return { error: "Já existe uma conta com este e-mail.", convite: null };
  }

  const senhaTemporaria = gerarSenhaTemporaria();
  const senhaHash = await hashSenha(senhaTemporaria);

  if (papel === "consultor") {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, papel, clinicaId: null },
    });
    await prisma.consultorAcesso.create({
      data: { usuarioId: usuario.id, clinicaId: ctx.clinicaId },
    });
  } else if (papel === "membro") {
    const permissoes = normalizarPermissoes(permissoesBrutas);
    await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        papel,
        cargo,
        clinicaId: ctx.clinicaId,
        permissoes: { create: permissoes },
      },
    });
  } else {
    await prisma.usuario.create({
      data: { nome, email, senhaHash, papel, clinicaId: ctx.clinicaId },
    });
  }

  revalidatePath("/equipe");
  return { error: null, convite: { nome, email, senhaTemporaria } };
});

const editarPermissoesSchema = z.object({
  id: z.string().trim().min(1),
  cargo: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  ...permissoesFormShape,
});

/**
 * Edita cargo + permissões de um membro já cadastrado — exclusivo do dono
 * (a edição em si, diferente da simples visualização da tela Equipe que
 * acessaEquipe já permite a um membro).
 */
export const editarPermissoesUsuario = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = editarPermissoesSchema.safeParse({
    id: formData.get("id"),
    cargo: formData.get("cargo") || undefined,
    ...lerPermissoesFormData(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, cargo, ...permissoesBrutas } = parsed.data;

  const usuario = await prisma.usuario.findFirst({ where: { id, clinicaId: ctx.clinicaId } });
  if (!usuario) return { error: "Usuário não encontrado." };
  if (usuario.papel !== "membro") {
    return { error: "Só é possível definir permissões para membros da equipe." };
  }

  const permissoes = normalizarPermissoes(permissoesBrutas);

  await prisma.usuario.update({ where: { id }, data: { cargo: cargo ?? null } });
  await prisma.permissaoUsuario.upsert({
    where: { usuarioId: id },
    create: { usuarioId: id, ...permissoes },
    update: permissoes,
  });

  revalidatePath("/equipe");
  return { error: null };
});

const alterarPapelSchema = z.object({
  id: z.string().trim().min(1),
  papel: z.enum(["dono", "membro"], { error: "Selecione um papel." }),
});

// Só troca entre "dono"/"membro" — mudar alguém já cadastrado na clínica
// para "consultor" mudaria o modelo do usuário inteiro (clinicaId fixo vs.
// múltiplas clínicas via ConsultorAcesso); fora do escopo desta tela.
export const alterarPapelUsuario = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = alterarPapelSchema.safeParse({
    id: formData.get("id"),
    papel: formData.get("papel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, papel } = parsed.data;

  if (id === ctx.usuarioId && papel !== "dono") {
    return { error: "Você não pode remover seu próprio papel de dono." };
  }

  const { count } = await prisma.usuario.updateMany({
    where: { id, clinicaId: ctx.clinicaId },
    data: { papel },
  });
  if (count === 0) return { error: "Usuário não encontrado." };

  revalidatePath("/equipe");
  return { error: null };
});

export const alternarAtivoUsuario = comSessaoSimples(["dono"], async (ctx, formData) => {
  const id = z.string().trim().min(1).parse(formData.get("id"));

  if (id === ctx.usuarioId) {
    throw new Error("Você não pode desativar seu próprio acesso.");
  }

  const usuario = await prisma.usuario.findFirst({ where: { id, clinicaId: ctx.clinicaId } });
  if (!usuario) return;

  await prisma.usuario.update({ where: { id }, data: { ativo: !usuario.ativo } });

  revalidatePath("/equipe");
});
