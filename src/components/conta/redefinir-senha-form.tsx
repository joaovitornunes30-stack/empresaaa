"use client";

import { useActionState } from "react";
import Link from "next/link";
import { redefinirSenha, type ActionState } from "@/app/(auth)/redefinir-senha/actions";

const initialState: ActionState = { error: null, sucesso: false };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(redefinirSenha, initialState);

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm text-center">
        <p className="text-sm text-foreground/70">
          Link inválido. Solicite uma nova redefinição de senha.
        </p>
        <Link href="/esqueci-senha" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark">
          Pedir novo link
        </Link>
      </div>
    );
  }

  if (state.sucesso) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm text-center">
        <p className="rounded-xl bg-good-bg px-3 py-2 text-sm text-good">
          Senha redefinida com sucesso. Todas as sessões anteriores foram encerradas.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark">
          Entrar com a nova senha
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="mb-1 font-display text-xl font-bold text-foreground">Redefinir senha</h1>
      <p className="mb-6 text-sm text-foreground/60">Escolha uma nova senha para sua conta.</p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="novaSenha" className={labelClass}>
            Nova senha
          </label>
          <input
            id="novaSenha"
            name="novaSenha"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmarSenha" className={labelClass}>
            Confirmar nova senha
          </label>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
            placeholder="Repita a senha"
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}
