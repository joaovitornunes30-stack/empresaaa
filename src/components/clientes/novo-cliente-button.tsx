"use client";

import { useActionState, useState } from "react";
import { criarCliente, type ActionState } from "@/app/clientes/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

const ORIGENS_SUGERIDAS = ["Instagram", "Indicação", "Google", "Walk-in"];

export function NovoClienteButton({
  clientes,
}: {
  clientes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarCliente, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        Novo Cliente
      </button>

      {open && (
        <Modal title="Novo Cliente" onClose={() => setOpen(false)}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="nome" className={labelClass}>
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className={inputClass}
                placeholder="Nome do cliente"
              />
            </div>

            <div>
              <label htmlFor="contato" className={labelClass}>
                Contato (opcional)
              </label>
              <input
                id="contato"
                name="contato"
                type="text"
                className={inputClass}
                placeholder="Telefone, WhatsApp ou e-mail"
              />
            </div>

            <div>
              <label htmlFor="origem" className={labelClass}>
                Origem (opcional)
              </label>
              <input
                id="origem"
                name="origem"
                type="text"
                list="origens-sugeridas"
                className={inputClass}
                placeholder="Ex: Instagram"
              />
              <datalist id="origens-sugeridas">
                {ORIGENS_SUGERIDAS.map((origem) => (
                  <option key={origem} value={origem} />
                ))}
              </datalist>
            </div>

            {clientes.length > 0 && (
              <div>
                <label htmlFor="indicadoPorId" className={labelClass}>
                  Indicado por (opcional)
                </label>
                <select id="indicadoPorId" name="indicadoPorId" className={inputClass} defaultValue="">
                  <option value="">Nenhum</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="observacoes" className={labelClass}>
                Observações (opcional)
              </label>
              <input
                id="observacoes"
                name="observacoes"
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
