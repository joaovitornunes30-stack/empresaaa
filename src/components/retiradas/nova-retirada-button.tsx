"use client";

import { useActionState, useState } from "react";
import { criarRetirada, type RetiradaState } from "@/app/(app)/retiradas/actions";
import { Modal } from "@/components/ui/modal";
import { MOTIVO_LABEL, MOTIVOS_RETIRADA } from "@/lib/retiradas";

const initialRetiradaState: RetiradaState = { error: null, aviso: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function NovaRetiradaButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarRetirada, initialRetiradaState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);
  const [avisoVisivel, setAvisoVisivel] = useState<string | null>(null);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
      setAvisoVisivel(state.aviso);
    }
  }

  function handleClose() {
    setOpen(false);
    setAvisoVisivel(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        Nova Retirada
      </button>

      {open && (
        <Modal title="Nova Retirada" onClose={handleClose}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className={labelClass}>
                  Valor (R$)
                </label>
                <input
                  id="valor"
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
                <label htmlFor="data" className={labelClass}>
                  Data
                </label>
                <input id="data" name="data" type="date" required className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="descricao" className={labelClass}>
                Descrição (opcional)
              </label>
              <input
                id="descricao"
                name="descricao"
                type="text"
                className={inputClass}
                placeholder="Detalhes adicionais"
              />
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <label htmlFor="motivo" className={labelClass}>
                Motivo
              </label>
              <select id="motivo" name="motivo" defaultValue="rotina" className={inputClass}>
                {MOTIVOS_RETIRADA.map((motivo) => (
                  <option key={motivo} value={motivo}>
                    {MOTIVO_LABEL[motivo]}
                  </option>
                ))}
              </select>

              <label htmlFor="observacao" className={`${labelClass} mt-3`}>
                Observação (opcional)
              </label>
              <input
                id="observacao"
                name="observacao"
                type="text"
                className={inputClass}
                placeholder="Quer contar mais alguma coisa? Fica à vontade para pular."
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
                onClick={handleClose}
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

      {avisoVisivel && (
        <Modal title="Retirada registrada" onClose={() => setAvisoVisivel(null)}>
          <p className="text-sm text-foreground/80">{avisoVisivel}</p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setAvisoVisivel(null)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
            >
              Entendi
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
