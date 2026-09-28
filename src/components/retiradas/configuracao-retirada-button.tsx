"use client";

import { useActionState, useState } from "react";
import {
  atualizarConfiguracaoRetirada,
  type ActionState,
} from "@/app/(app)/retiradas/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

/** Editável por dono e consultor — ver comentário em retiradas/actions.ts. */
export function ConfiguracaoRetiradaButton({
  percentualAtual,
  proLaboreAtual,
}: {
  percentualAtual: number;
  proLaboreAtual: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(atualizarConfiguracaoRetirada, initialState);
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
        Ajustar parâmetros
      </button>

      {open && (
        <Modal title="Parâmetros da retirada saudável" onClose={() => setOpen(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="percentualReservaRetirada" className={labelClass}>
                % da sobra que fica reservada na clínica
              </label>
              <input
                id="percentualReservaRetirada"
                name="percentualReservaRetirada"
                type="number"
                step="1"
                min="0"
                max="100"
                required
                defaultValue={percentualAtual}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground/50">
                O restante da sobra média dos últimos 3 meses vira a retirada saudável.
              </p>
            </div>

            <div>
              <label htmlFor="proLaboreCombinado" className={labelClass}>
                Pró-labore combinado (opcional)
              </label>
              <input
                id="proLaboreCombinado"
                name="proLaboreCombinado"
                type="number"
                step="0.01"
                min="0"
                defaultValue={proLaboreAtual ?? undefined}
                placeholder="0,00"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground/50">
                Usado como referência enquanto ainda não há 3 meses fechados de histórico.
              </p>
            </div>

            {state.error && (
              <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
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
