"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarSenha, criarSessao, rotaPadraoParaPapel } from "@/lib/auth";
import { estaBloqueadoPorTentativas, registrarTentativaFalha, obterIpCliente, MENSAGEM_BLOQUEIO } from "@/lib/rate-limit";
import type { Papel } from "@/lib/tenant-context";

export type ActionState = {
  error: string | null;
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

const PAPEIS_VALIDOS: Papel[] = ["dono", "membro", "consultor", "adminPlataforma"];

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, senha } = parsed.data;

  // Limite de tentativas por e-mail E por IP — qualquer um dos dois
  // travado já barra a tentativa, antes mesmo de consultar a senha.
  const ip = await obterIpCliente();
  const chaveEmail = `email:${email}`;
  const chaveIp = `ip:${ip}`;
  if ((await estaBloqueadoPorTentativas(chaveEmail)) || (await estaBloqueadoPorTentativas(chaveIp))) {
    return { error: MENSAGEM_BLOQUEIO };
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    await registrarTentativaFalha(chaveEmail);
    await registrarTentativaFalha(chaveIp);
    return { error: "E-mail ou senha inválidos." };
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaValida) {
    await registrarTentativaFalha(chaveEmail);
    await registrarTentativaFalha(chaveIp);
    return { error: "E-mail ou senha inválidos." };
  }

  if (!PAPEIS_VALIDOS.includes(usuario.papel as Papel)) {
    return { error: "Papel de usuário inválido. Contate o suporte." };
  }
  const papel = usuario.papel as Papel;

  if (papel === "adminPlataforma") {
    // Não pertence a nenhuma clínica — clinicaId/clinicaNome ficam vazios
    // (sentinela nunca usado em nenhuma consulta isolada por clínica).
    await criarSessao({
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel,
      clinicaId: "",
      clinicaNome: "",
    });
  } else if (papel === "consultor") {
    const ultimoAcesso = await prisma.consultorAcesso.findFirst({
      where: { usuarioId: usuario.id },
      orderBy: { dataAcesso: "desc" },
      include: { clinica: { select: { id: true, nome: true } } },
    });

    if (!ultimoAcesso) {
      return { error: "Este consultor ainda não tem acesso a nenhuma clínica." };
    }

    // O login não entra em nenhuma clínica específica — a tela inicial do
    // consultor é a Central do Consultor (hub multi-clínica), não a Análise
    // de uma clínica. O registro em ConsultorAcesso (que alimenta o banner
    // "Consultor visualizou em [data/hora]") só acontece quando ele de fato
    // clica para entrar numa clínica, em trocarClinicaConsultor. A última
    // clínica visitada só define o clinicaId inicial da sessão, usado se ele
    // navegar direto para uma aba pela barra lateral sem passar pela Central.
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
