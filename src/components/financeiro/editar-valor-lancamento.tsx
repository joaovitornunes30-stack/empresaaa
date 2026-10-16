"use client";

import { useActionState, useState } from "react";
import {
  editarValorLancamentoGerado,
  type ActionState,
} from "@/app/(app)/financeiro/actions";

const initialState: ActionState = { error: null };

export function EditarValorLancamento({
  id,
  valorAtual,
}: {
  id: string;
  valorAtual: number;
}) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(
    editarValorLancamentoGerado,
    initialState,
  );

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-xs font-medium text-primary hover:text-primary-dark"
      >
        Editar valor
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-1.5">
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={valorAtual}
          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs font-medium text-primary hover:text-primary-dark disabled:opacity-60"
        >
          {pending ? "..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-xs font-medium text-foreground/50 hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
      {state.error && <p className="text-xs text-warn">{state.error}</p>}
    </form>
  );
}
