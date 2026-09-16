"use client";

import { useActionState, useState } from "react";
import { criarProduto, type ActionState } from "@/app/produtos/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function NovoProdutoButton({
  perfis,
}: {
  perfis: { id: string; nome: string; aliquota: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    criarProduto,
    initialState,
  );
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
        disabled={perfis.length === 0}
        title={
          perfis.length === 0
            ? "Cadastre um perfil tributário primeiro"
            : undefined
        }
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Novo Produto
      </button>

      {open && (
        <Modal title="Novo Produto" onClose={() => setOpen(false)}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="nome" className={labelClass}>
                Nome do produto
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className={inputClass}
                placeholder="Ex: Limpeza de Pele"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="precoVenda" className={labelClass}>
                  Preço de venda (R$)
                </label>
                <input
                  id="precoVenda"
                  name="precoVenda"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label htmlFor="custoMedioMaterial" className={labelClass}>
                  Custo médio material (R$)
                </label>
                <input
                  id="custoMedioMaterial"
                  name="custoMedioMaterial"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="perfilTributarioId" className={labelClass}>
                Perfil tributário
              </label>
              <select
                id="perfilTributarioId"
                name="perfilTributarioId"
                required
                className={inputClass}
              >
                {perfis.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome} ({perfil.aliquota}%)
                  </option>
                ))}
              </select>
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
                {pending ? "Salvando..." : "Salvar produto"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
