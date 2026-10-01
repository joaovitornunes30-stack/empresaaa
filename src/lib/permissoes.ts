import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lerSessao, type ActionState } from "@/lib/auth";
import { runWithTenant, type Papel, type TenantContext } from "@/lib/tenant-context";

/**
 * Uma aba/área do produto sujeita a permissão granular quando papel="membro".
 * "retiradas" é uma aba própria (rota /retiradas separada de /financeiro),
 * mas sua permissão depende também de acessaFinanceiro (ver abaPermitida).
 */
export type Aba = "analise" | "produtos" | "clientes" | "financeiro" | "retiradas" | "equipe";

const ABA_ORDEM: Aba[] = ["analise", "produtos", "clientes", "financeiro", "retiradas", "equipe"];

const ABA_ROTA: Record<Aba, string> = {
  analise: "/analise",
  produtos: "/produtos",
  clientes: "/clientes",
  financeiro: "/financeiro",
  retiradas: "/retiradas",
  equipe: "/equipe",
};

export type Permissoes = {
  acessaProdutos: boolean;
  acessaClientes: boolean;
  acessaFinanceiro: boolean;
  acessaFinanceiroRetiradas: boolean;
  acessaAnalise: boolean;
  acessaEquipe: boolean;
};

/** Só existe (e só é consultada) para Usuario com papel="membro". */
export async function buscarPermissoesMembro(usuarioId: string): Promise<Permissoes | null> {
  return prisma.permissaoUsuario.findUnique({ where: { usuarioId } });
}

async function permissoesDaSessao(sessao: TenantContext): Promise<Permissoes | null> {
  if (sessao.papel !== "membro") return null;
  return buscarPermissoesMembro(sessao.usuarioId);
}

/**
 * "dono" tem acesso total e fixo. "consultor" tem acesso de leitura a tudo
 * exceto Equipe (gerenciar equipe nunca foi parte do modo consultor).
 * "membro" depende inteiramente de PermissaoUsuario — sem registro, sem
 * acesso a nada (falha fechada).
 */
function abaPermitida(papel: Papel, permissoes: Permissoes | null, aba: Aba): boolean {
  if (papel === "dono") return true;
  if (papel === "consultor") return aba !== "equipe";
  if (!permissoes) return false;
  switch (aba) {
    case "produtos":
      return permissoes.acessaProdutos;
    case "clientes":
      return permissoes.acessaClientes;
    case "financeiro":
      return permissoes.acessaFinanceiro;
    case "retiradas":
      // Retiradas é dado sensível mesmo para quem já acessa Financeiro —
      // exige as duas flags.
      return permissoes.acessaFinanceiro && permissoes.acessaFinanceiroRetiradas;
    case "analise":
      return permissoes.acessaAnalise;
    case "equipe":
      return permissoes.acessaEquipe;
  }
}

export async function temPermissaoAba(sessao: TenantContext, aba: Aba): Promise<boolean> {
  const permissoes = await permissoesDaSessao(sessao);
  return abaPermitida(sessao.papel, permissoes, aba);
}

/** Abas visíveis para a sessão, na ordem de navegação — usada pelo Sidebar. */
export async function abasPermitidas(sessao: TenantContext): Promise<Aba[]> {
  const permissoes = await permissoesDaSessao(sessao);
  return ABA_ORDEM.filter((aba) => abaPermitida(sessao.papel, permissoes, aba));
}

/**
 * Para uso em Server Components (page.tsx) de uma aba específica. Redireciona
 * para /login sem sessão; sem permissão para `aba`, redireciona para a
 * primeira aba que a sessão de fato acessa (ou /sem-acesso, se nenhuma) —
 * nunca para a rota "padrão" estática do papel, que poderia não ser
 * permitida para este membro específico e causar um loop de redirecionamento.
 */
export async function exigirSessaoAba(aba: Aba): Promise<TenantContext> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  const permissoes = await permissoesDaSessao(sessao);
  if (abaPermitida(sessao.papel, permissoes, aba)) return sessao;

  const alternativa = ABA_ORDEM.find((candidata) => abaPermitida(sessao.papel, permissoes, candidata));
  redirect(alternativa ? ABA_ROTA[alternativa] : "/sem-acesso");
}

/**
 * Mesma ideia de comSessao (lib/auth.ts), mas checando a permissão granular
 * da aba em vez de uma lista estática de papeis — "dono" sempre passa,
 * "consultor" nunca (mutações são sempre bloqueadas para ele), "membro"
 * precisa da flag correspondente em PermissaoUsuario.
 */
export function comSessaoAba<S extends { error: string | null } = ActionState>(
  aba: Aba,
  handler: (ctx: TenantContext, prevState: S, formData: FormData) => Promise<S>,
) {
  return async (prevState: S, formData: FormData): Promise<S> => {
    const sessao = await lerSessao();
    if (!sessao) redirect("/login");

    if (sessao.papel === "consultor" || !(await temPermissaoAba(sessao, aba))) {
      return { error: "Você não tem permissão para esta ação." } as S;
    }

    return runWithTenant(sessao, () => handler(sessao, prevState, formData));
  };
}

/** Mesma ideia de comSessaoSimples (lib/auth.ts), com checagem por aba. */
export function comSessaoSimplesAba(
  aba: Aba,
  handler: (ctx: TenantContext, formData: FormData) => Promise<void>,
) {
  return async (formData: FormData): Promise<void> => {
    const sessao = await lerSessao();
    if (!sessao) redirect("/login");

    if (sessao.papel === "consultor" || !(await temPermissaoAba(sessao, aba))) {
      throw new Error("Você não tem permissão para esta ação.");
    }

    return runWithTenant(sessao, () => handler(sessao, formData));
  };
}
