import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { runWithTenant, type Papel, type TenantContext } from "@/lib/tenant-context";
import {
  SESSION_COOKIE,
  SESSION_DURATION_SEGUNDOS,
  assinarSessao,
  verificarTokenSessao,
  type SessionPayload,
} from "@/lib/session-edge";
import { rotaPadraoParaPapel } from "@/lib/rotas";

export type { SessionPayload };
export { rotaPadraoParaPapel };

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

/** Senha inicial gerada para um convite de equipe — exibida uma única vez
 * na tela para o dono repassar (sem envio de e-mail nesta versão). */
export function gerarSenhaTemporaria() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let senha = "";
  for (let i = 0; i < 10; i++) {
    senha += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return senha;
}

export async function criarSessao(payload: SessionPayload) {
  const token = await assinarSessao(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SEGUNDOS,
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function lerSessao(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificarTokenSessao(token);
}

/**
 * Para uso em Server Components (page.tsx/layout.tsx). Redireciona para
 * /login se não houver sessão, e para a rota padrão do papel do usuário se
 * `papeisPermitidos` for informado e o papel atual não estiver na lista.
 * Não estabelece o contexto de tenant sozinho — combine com runWithTenant:
 *
 *   const sessao = await exigirSessaoPagina(["dono", "equipe"]);
 *   return runWithTenant(sessao, async () => { ...consultas prisma... });
 */
export async function exigirSessaoPagina(papeisPermitidos?: Papel[]): Promise<TenantContext> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  if (papeisPermitidos && !papeisPermitidos.includes(sessao.papel)) {
    redirect(rotaPadraoParaPapel(sessao.papel));
  }

  return sessao;
}

export type ActionState = { error: string | null };

/**
 * Envolve uma Server Action no formato usado por useActionState
 * ((prevState, formData) => Promise<ActionState>): exige sessão válida e
 * (se informado) um papel permitido, e roda o handler dentro do contexto de
 * tenant correto (runWithTenant), para que toda query Prisma feita dentro
 * dele já saia isolada pela clínica certa. "consultor" nunca executa uma
 * mutação — bloqueado incondicionalmente, mesmo que apareça na lista.
 */
export function comSessao<S extends { error: string | null } = ActionState>(
  papeisPermitidos: Papel[],
  handler: (ctx: TenantContext, prevState: S, formData: FormData) => Promise<S>,
) {
  return async (prevState: S, formData: FormData): Promise<S> => {
    const sessao = await lerSessao();
    if (!sessao) redirect("/login");

    if (sessao.papel === "consultor" || !papeisPermitidos.includes(sessao.papel)) {
      return { error: "Você não tem permissão para esta ação." } as S;
    }

    return runWithTenant(sessao, () => handler(sessao, prevState, formData));
  };
}

/**
 * Mesma ideia de comSessao, para Server Actions "simples" chamadas direto
 * de <form action={...}> sem useActionState — assinatura
 * (formData) => Promise<void>. Essas ações não têm onde exibir um erro
 * inline, então uma violação de sessão/papel lança em vez de retornar um
 * estado: a UI já esconde o botão/form para quem não tem o papel
 * necessário, então chegar aqui sem permissão só aconteceria contornando a
 * UI, e um erro é a resposta correta nesse caso.
 */
export function comSessaoSimples(
  papeisPermitidos: Papel[],
  handler: (ctx: TenantContext, formData: FormData) => Promise<void>,
) {
  return async (formData: FormData): Promise<void> => {
    const sessao = await lerSessao();
    if (!sessao) redirect("/login");

    if (sessao.papel === "consultor" || !papeisPermitidos.includes(sessao.papel)) {
      throw new Error("Você não tem permissão para esta ação.");
    }

    return runWithTenant(sessao, () => handler(sessao, formData));
  };
}
