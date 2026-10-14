"use client";

import { useActionState, useState } from "react";
import { atualizarAjusteCalculo, type ActionState } from "@/app/(app)/retiradas/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

/** Só o dono ajusta (diferente de "Ajustar parâmetros", que dono e consultor editam). */
export function AjusteCalculoButton({
  horizonteAtual,
  reservaAtual,
}: {
  horizonteAtual: number;
  reservaAtual: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(atualizarAjusteCalculo, initialState);
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
        Ajustar cálculo
      </button>

      {open && (
        <Modal title="Ajustar cálculo da Retirada ideal" onClose={() => setOpen(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="horizonteDiasCompromissos" className={labelClass}>
                Horizonte de compromissos (dias)
              </label>
              <input
                id="horizonteDiasCompromissos"
                name="horizonteDiasCompromissos"
                type="number"
                step="1"
                min="1"
                required
                defaultValue={horizonteAtual}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground/50">
                Quantos dias à frente olhamos para separar parcelas, salários e despesas
                já programadas antes de calcular o caixa livre.
              </p>
            </div>

            <div>
              <label htmlFor="reservaMesesCustoFixo" className={labelClass}>
                Reserva mínima (meses de custo fixo)
              </label>
              <input
                id="reservaMesesCustoFixo"
                name="reservaMesesCustoFixo"
                type="number"
                step="0.1"
                min="0"
                required
                defaultValue={reservaAtual}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground/50">
                Quantos meses do custo fixo médio ficam sempre reservados no caixa,
                nunca contados como livres para retirada.
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
