"use client";

import { useActionState, useState } from "react";
import { criarEntradaSaida, type ActionState } from "@/app/financeiro/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function NovaVendaClienteButton({
  clienteId,
  produtos,
  compact,
  nomeCliente,
}: {
  clienteId: string;
  produtos: { id: string; nome: string }[];
  compact?: boolean;
  nomeCliente?: string;
}) {
  const [open, setOpen] = useState(false);
  const [produtoId, setProdutoId] = useState("");
  const [state, formAction, pending] = useActionState(criarEntradaSaida, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
      setProdutoId("");
    }
  }

  function handleClose() {
    setOpen(false);
    setProdutoId("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={compact ? "Nova venda" : undefined}
        className={
          compact
            ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
            : "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        }
      >
        {compact ? "+" : "+ Nova Venda"}
      </button>

      {open && (
        <Modal title={nomeCliente ? `Nova Venda — ${nomeCliente}` : "Nova Venda"} onClose={handleClose}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="tipo" value="entrada" />
            <input type="hidden" name="categoria" value="Vendas" />
            <input type="hidden" name="clienteId" value={clienteId} />

            {produtos.length > 0 && (
              <div>
                <label htmlFor="produtoId" className={labelClass}>
                  Produto (opcional)
                </label>
                <select
                  id="produtoId"
                  name="produtoId"
                  className={inputClass}
                  value={produtoId}
                  onChange={(event) => setProdutoId(event.target.value)}
                >
                  <option value="">Nenhum</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {produtoId && (
              <div>
                <label htmlFor="quantidadeVendida" className={labelClass}>
                  Quantidade vendida
                </label>
                <input
                  id="quantidadeVendida"
                  name="quantidadeVendida"
                  type="number"
                  step="1"
                  min="1"
                  className={inputClass}
                  placeholder="Ex: 1"
                />
                <p className="mt-1 text-xs text-foreground/50">
                  Baixa automaticamente do estoque desse produto.
                </p>
              </div>
            )}

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
              <label htmlFor="fechadoPor" className={labelClass}>
                Fechado por (opcional)
              </label>
              <input
                id="fechadoPor"
                name="fechadoPor"
                type="text"
                className={inputClass}
                placeholder="Nome de quem fechou a venda"
              />
            </div>

            <div>
              <label htmlFor="dataProximoRetorno" className={labelClass}>
                Data do próximo retorno (opcional)
              </label>
              <input
                id="dataProximoRetorno"
                name="dataProximoRetorno"
                type="date"
                className={inputClass}
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
    </>
  );
}
