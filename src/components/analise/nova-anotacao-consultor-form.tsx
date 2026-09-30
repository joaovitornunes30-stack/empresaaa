"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarAnotacaoConsultor, type ActionState } from "@/app/(app)/analise/actions";

const initialState: ActionState = { error: null };

export function NovaAnotacaoConsultorForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(criarAnotacaoConsultor, initialState);

  useEffect(() => {
    if (state !== initialState && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mb-3 flex flex-col gap-2">
      <textarea
        name="texto"
        required
        rows={2}
        placeholder="Escreva uma anotação para o dono desta clínica..."
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {state.error && <p className="text-sm text-warn">{state.error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar anotação"}
        </button>
      </div>
    </form>
  );
}
