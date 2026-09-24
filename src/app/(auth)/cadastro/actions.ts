"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSenha, criarSessao, rotaPadraoParaPapel } from "@/lib/auth";

export type ActionState = {
  error: string | null;
};

const cadastroSchema = z.object({
  nomeClinica: z.string().trim().min(1, "Informe o nome da clínica."),
  nomeDono: z.string().trim().min(1, "Informe seu nome."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

export async function criarClinica(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cadastroSchema.safeParse({
    nomeClinica: formData.get("nomeClinica"),
    nomeDono: formData.get("nomeDono"),
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nomeClinica, nomeDono, email, senha } = parsed.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const senhaHash = await hashSenha(senha);

  const { clinica, usuario } = await prisma.$transaction(async (tx) => {
    const clinica = await tx.clinica.create({ data: { nome: nomeClinica } });
    const usuario = await tx.usuario.create({
      data: {
        nome: nomeDono,
        email,
        senhaHash,
        papel: "dono",
        clinicaId: clinica.id,
      },
    });
    return { clinica, usuario };
  });

  await criarSessao({
    usuarioId: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: "dono",
    clinicaId: clinica.id,
    clinicaNome: clinica.nome,
  });

  redirect(rotaPadraoParaPapel("dono"));
}
