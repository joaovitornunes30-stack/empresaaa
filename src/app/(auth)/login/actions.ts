"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarSenha, criarSessao, rotaPadraoParaPapel } from "@/lib/auth";
import type { Papel } from "@/lib/tenant-context";

export type ActionState = {
  error: string | null;
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

const PAPEIS_VALIDOS: Papel[] = ["dono", "equipe", "consultor"];

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, senha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return { error: "E-mail ou senha inválidos." };
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaValida) {
    return { error: "E-mail ou senha inválidos." };
  }

  if (!PAPEIS_VALIDOS.includes(usuario.papel as Papel)) {
    return { error: "Papel de usuário inválido. Contate o suporte." };
  }
  const papel = usuario.papel as Papel;

  if (papel === "consultor") {
    const ultimoAcesso = await prisma.consultorAcesso.findFirst({
      where: { usuarioId: usuario.id },
      orderBy: { dataAcesso: "desc" },
      include: { clinica: { select: { id: true, nome: true } } },
    });

    if (!ultimoAcesso) {
      return { error: "Este consultor ainda não tem acesso a nenhuma clínica." };
    }

    // Cada acesso (incluindo o login em si) grava um novo registro — é o
    // que alimenta o banner "Consultor visualizou em [data/hora]".
    await prisma.consultorAcesso.create({
      data: { usuarioId: usuario.id, clinicaId: ultimoAcesso.clinicaId },
    });

    await criarSessao({
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel,
      clinicaId: ultimoAcesso.clinicaId,
      clinicaNome: ultimoAcesso.clinica.nome,
    });
  } else {
    if (!usuario.clinicaId) {
      return { error: "Usuário sem clínica associada. Contate o suporte." };
    }

    const clinica = await prisma.clinica.findUnique({ where: { id: usuario.clinicaId } });
    if (!clinica) {
      return { error: "Clínica não encontrada." };
    }

    await criarSessao({
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel,
      clinicaId: clinica.id,
      clinicaNome: clinica.nome,
    });
  }

  redirect(rotaPadraoParaPapel(papel));
}
