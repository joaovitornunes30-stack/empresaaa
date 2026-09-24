"use client";

import { useActionState } from "react";
import { editarClinica, type ActionState } from "@/app/(app)/minha-clinica/actions";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function EditarClinicaForm({ nomeAtual }: { nomeAtual: string }) {
  const [state, formAction, pending] = useActionState(editarClinica, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div>
        <label htmlFor="nome" className={labelClass}>
          Nome da clínica
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          defaultValue={nomeAtual}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
