import { AsyncLocalStorage } from "node:async_hooks";

export type Papel = "dono" | "membro" | "consultor";

export type TenantContext = {
  usuarioId: string;
  nome: string;
  email: string;
  papel: Papel;
  clinicaId: string;
  clinicaNome: string;
};

const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Estabelece o contexto de clínica/usuário ativo para toda a árvore
 * assíncrona executada dentro de `fn` — inclusive chamadas ao Prisma feitas
 * em qualquer função chamada (direta ou indiretamente) por `fn`. É assim que
 * o client extension em lib/prisma.ts sabe qual clinicaId aplicar em cada
 * query, sem precisar que cada chamada passe o id manualmente.
 */
export function runWithTenant<T>(contexto: TenantContext, fn: () => T): T {
  return tenantStorage.run(contexto, fn);
}

/**
 * Lê o contexto de clínica ativo. Lança erro se chamada fora de
 * runWithTenant — toda query a um modelo com clinicaId exige isso, então um
 * erro aqui indica um page/action que esqueceu de chamar exigirSessao +
 * runWithTenant, não um estado válido a ser silenciosamente ignorado.
 */
export function tenantAtual(): TenantContext {
  const contexto = tenantStorage.getStore();
  if (!contexto) {
    throw new Error(
      "Nenhum contexto de clínica ativo. Toda função que consulta um modelo " +
        "isolado por clínica precisa rodar dentro de runWithTenant (ver " +
        "exigirSessaoPagina/comSessao em lib/auth.ts).",
    );
  }
  return contexto;
}
