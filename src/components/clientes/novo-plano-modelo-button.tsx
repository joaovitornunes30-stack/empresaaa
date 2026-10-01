"use client";

import { useActionState, useState } from "react";
import { criarPlanoModelo, type ActionState } from "@/app/(app)/clientes/planos/modelos/actions";
import { Modal } from "@/components/ui/modal";
import {
  PlanoItensEditor,
  criarItemVazio,
  itensParaPayload,
  type PlanoItemFormRow,
} from "@/components/clientes/plano-itens-editor";

const initialState: ActionState = { error: null };
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function NovoPlanoModeloButton({
  produtos,
}: {
  produtos: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState<PlanoItemFormRow[]>([criarItemVazio()]);
  const [state, formAction, pending] = useActionState(criarPlanoModelo, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
      setNome("");
      setItens([criarItemVazio()]);
    }
  }

  function handleClose() {
    setOpen(false);
    setNome("");
    setItens([criarItemVazio()]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        Novo Modelo
      </button>

      {open && (
        <Modal title="Novo Modelo de Plano" onClose={handleClose}>
          <form
            action={(formData) => {
              formData.set("itensJson", JSON.stringify(itensParaPayload(itens)));
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="modelo-nome" className={labelClass}>
                Nome do modelo
              </label>
              <input
                id="modelo-nome"
                name="nome"
                type="text"
                required
                className={inputClass}
                placeholder='Ex: "Botox Pro", "Full 6 Meses"'
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </div>

            <PlanoItensEditor produtos={produtos} itens={itens} onChange={setItens} />

            {state.error && (
              <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
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
                {pending ? "Salvando..." : "Salvar modelo"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
