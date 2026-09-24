"use client";

import { useActionState, useState } from "react";
import { definirMetaLucro, type ActionState } from "@/app/financeiro/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function DefinirMetaButton({
  mes,
  metaAtual,
}: {
  mes: string;
  metaAtual: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    definirMetaLucro,
    initialState,
  );
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:text-primary-dark"
      >
        {metaAtual === null ? "Definir meta de lucro do mês" : "Editar meta"}
      </button>

      {open && (
        <Modal title="Meta de lucro do mês" onClose={() => setOpen(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="mes" value={mes} />
            <div>
              <label htmlFor="meta-valor" className={labelClass}>
                Valor da meta (R$)
              </label>
              <input
                id="meta-valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={metaAtual ?? undefined}
                className={inputClass}
                placeholder="0,00"
              />
            </div>

            {state.error && (
              <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
                {state.error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
