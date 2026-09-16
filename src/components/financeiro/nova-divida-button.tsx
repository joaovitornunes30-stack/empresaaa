"use client";

import { useActionState, useState } from "react";
import { criarDivida, type ActionState } from "@/app/financeiro/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function NovaDividaButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarDivida, initialState);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary-dark"
      >
        Nova Dívida
      </button>

      {open && (
        <Modal title="Nova Dívida" onClose={() => setOpen(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="d-valor" className={labelClass}>
                  Valor (R$)
                </label>
                <input
                  id="d-valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label htmlFor="d-vencimento" className={labelClass}>
                  Data de vencimento
                </label>
                <input
                  id="d-vencimento"
                  name="dataVencimento"
                  type="date"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="d-parcelas" className={labelClass}>
                Número de parcelas (opcional)
              </label>
              <input
                id="d-parcelas"
                name="numeroParcelas"
                type="number"
                step="1"
                min="1"
                className={inputClass}
                placeholder="Ex: 6"
              />
            </div>

            <div>
              <label htmlFor="d-descricao" className={labelClass}>
                Descrição (opcional)
              </label>
              <input
                id="d-descricao"
                name="descricao"
                type="text"
                className={inputClass}
                placeholder="Detalhes adicionais"
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
