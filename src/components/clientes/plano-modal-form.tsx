"use client";

import { useActionState, useEffect, useState } from "react";
import { criarPlano, type ActionState } from "@/app/(app)/clientes/planos/actions";
import { Modal } from "@/components/ui/modal";
import {
  PlanoItensEditor,
  criarItemVazio,
  criarItemDeModelo,
  itensParaPayload,
  type PlanoItemFormRow,
} from "@/components/clientes/plano-itens-editor";

const initialState: ActionState = { error: null };
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export type PlanoModeloOpcao = {
  id: string;
  nome: string;
  itens: { produtoId: string; quantidadeSessoes: number; valorItem: number; intervaloDias: number }[];
};

export function PlanoModalForm({
  produtos,
  modelos,
  clientes,
  clienteId,
  nomeCliente,
  onClose,
}: {
  produtos: { id: string; nome: string }[];
  modelos: PlanoModeloOpcao[];
  clientes?: { id: string; nome: string }[];
  clienteId?: string;
  nomeCliente?: string;
  onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [itens, setItens] = useState<PlanoItemFormRow[]>([criarItemVazio()]);
  const [state, formAction, pending] = useActionState(criarPlano, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  useEffect(() => {
    if (submittedOnce && !state.error) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function aplicarModelo(id: string) {
    setModeloId(id);
    const modelo = modelos.find((m) => m.id === id);
    if (modelo) {
      setNome(modelo.nome);
      setItens(modelo.itens.map(criarItemDeModelo));
    }
  }

  return (
    <Modal
      title={nomeCliente ? `Novo Plano — ${nomeCliente}` : "Novo Plano"}
      onClose={onClose}
    >
      <form
        action={(formData) => {
          formData.set("itensJson", JSON.stringify(itensParaPayload(itens)));
          setSubmittedOnce(true);
          formAction(formData);
        }}
        className="flex flex-col gap-4"
      >
        {clienteId && <input type="hidden" name="clienteId" value={clienteId} />}

        {modelos.length > 0 && (
          <div>
            <label htmlFor="plano-modelo" className={labelClass}>
              Partir de um modelo (opcional)
            </label>
            <select
              id="plano-modelo"
              className={inputClass}
              value={modeloId}
              onChange={(event) => aplicarModelo(event.target.value)}
            >
              <option value="">Montar do zero</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="plano-nome" className={labelClass}>
            Nome do plano
          </label>
          <input
            id="plano-nome"
            name="nome"
            type="text"
            required
            className={inputClass}
            placeholder='Ex: "Full 6 Meses - Maria"'
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </div>

        {!clienteId && clientes && clientes.length > 0 && (
          <div>
            <label htmlFor="plano-cliente" className={labelClass}>
              Cliente (opcional)
            </label>
            <select
              id="plano-cliente"
              name="clienteId"
              className={inputClass}
              value={clienteSelecionado}
              onChange={(event) => setClienteSelecionado(event.target.value)}
            >
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
          <label htmlFor="plano-data-venda" className={labelClass}>
            Data da venda
          </label>
          <input
            id="plano-data-venda"
            name="dataVenda"
            type="date"
            required
            className={inputClass}
          />
        </div>

        <PlanoItensEditor produtos={produtos} itens={itens} onChange={setItens} />

        {state.error && (
          <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar plano"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
