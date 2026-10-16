"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRedefinicao, type ActionState } from "@/app/(auth)/esqueci-senha/actions";
import { MENSAGEM_GENERICA_RECUPERACAO } from "@/lib/recuperacao-senha-mensagens";

const initialState: ActionState = { error: null, enviado: false };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function EsqueciSenhaForm() {
  const [state, formAction, pending] = useActionState(solicitarRedefinicao, initialState);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="mb-1 font-display text-xl font-bold text-foreground">Esqueci minha senha</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      {state.enviado ? (
        <p className="rounded-xl bg-good-bg px-3 py-2 text-sm text-good">{MENSAGEM_GENERICA_RECUPERACAO}</p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
              placeholder="voce@clinica.com"
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
            {pending ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-foreground/60">
        <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
          &larr; Voltar para o login
        </Link>
      </p>
    </div>
  );
}
