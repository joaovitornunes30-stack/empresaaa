"use client";

import { useActionState, useState } from "react";
import {
  registrarMovimentoEstoque,
  type ActionState,
} from "@/app/(app)/analise/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function RegistrarMovimentoEstoqueButton({
  produtos,
}: {
  produtos: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    registrarMovimentoEstoque,
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
        disabled={produtos.length === 0}
        title={
          produtos.length === 0 ? "Cadastre um produto primeiro" : undefined
        }
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Registrar Movimento de Estoque
      </button>

      {open && (
        <Modal title="Movimento de Estoque" onClose={() => setOpen(false)}>
          <p className="-mt-1 mb-1 text-xs text-foreground/50">
            Use para compra de material (entrada) ou avaria/perda (saída).
            Vendas não devem ser lançadas aqui — elas baixam o estoque
            automaticamente ao registrar a entrada com produto e quantidade
            no Financeiro.
          </p>
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="produtoId" className={labelClass}>
                Produto
              </label>
              <select
                id="produtoId"
                name="produtoId"
                required
                className={inputClass}
              >
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tipo" className={labelClass}>
                Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                required
                className={inputClass}
                defaultValue="entrada"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantidade" className={labelClass}>
                  Quantidade
                </label>
                <input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  step="1"
                  min="1"
                  required
                  className={inputClass}
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <label htmlFor="data" className={labelClass}>
                  Data
                </label>
                <input
                  id="data"
                  name="data"
                  type="date"
                  required
                  className={inputClass}
                />
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
                placeholder='Ex: "avaria", "compra", "uso em atendimento"'
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
