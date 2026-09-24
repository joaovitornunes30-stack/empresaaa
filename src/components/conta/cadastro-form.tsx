"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarClinica, type ActionState } from "@/app/(auth)/cadastro/actions";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function CadastroForm() {
  const [state, formAction, pending] = useActionState(criarClinica, initialState);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="mb-1 font-display text-xl font-bold text-foreground">
        Criar minha clínica
      </h1>
      <p className="mb-6 text-sm text-foreground/60">
        Cadastre sua clínica e comece a usar o Aivy — você entra como dono.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nomeClinica" className={labelClass}>
            Nome da clínica
          </label>
          <input
            id="nomeClinica"
            name="nomeClinica"
            type="text"
            required
            className={inputClass}
            placeholder="Ex: Clínica Bella Pele"
          />
        </div>

        <div>
          <label htmlFor="nomeDono" className={labelClass}>
            Seu nome
          </label>
          <input
            id="nomeDono"
            name="nomeDono"
            type="text"
            required
            className={inputClass}
            placeholder="Ex: Maria Fernandes"
          />
        </div>

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

        <div>
          <label htmlFor="senha" className={labelClass}>
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className={inputClass}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar minha clínica"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-foreground/60">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
          Entrar
        </Link>
      </p>
    </div>
  );
}
