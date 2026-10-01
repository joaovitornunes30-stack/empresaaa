"use client";

import { useActionState, useState } from "react";
import {
  ativarPagamentoDivida,
  criarDivida,
  type ActionState,
} from "@/app/(app)/financeiro/actions";
import { Modal } from "@/components/ui/modal";
import { formatarData, formatarMoeda } from "@/lib/financeiro";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type Divida = {
  id: string;
  valor: number;
  dataVencimento: Date;
  numeroParcelas: number | null;
  valorParcela: number | null;
  descricao: string | null;
  status: string;
};

export function DividasManager({ dividas }: { dividas: Divida[] }) {
  const [open, setOpen] = useState(false);

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
        <Modal title="Dívidas" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            {dividas.length === 0 && (
              <p className="text-sm text-foreground/60">
                Nenhuma dívida cadastrada ainda.
              </p>
            )}
            {dividas.map((divida) => (
              <DividaRow key={divida.id} divida={divida} />
            ))}
          </div>

          <div className="my-5 h-px bg-border" />

          <NovaDividaForm />
        </Modal>
      )}
    </>
  );
}

function DividaRow({ divida }: { divida: Divida }) {
  const [ativando, setAtivando] = useState(false);
  const [state, formAction, pending] = useActionState(
    ativarPagamentoDivida,
    initialState,
  );

  if (!ativando || divida.status === "em_pagamento") {
    return (
      <div className="rounded-xl border border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatarMoeda(divida.valor)}
            </p>
            <p className="text-xs text-foreground/60">
              Vencimento {formatarData(divida.dataVencimento)}
              {divida.descricao ? ` · ${divida.descricao}` : ""}
            </p>
          </div>
          {divida.status === "em_pagamento" ? (
            <span className="rounded-full bg-good-bg px-3 py-1 text-xs font-semibold text-good">
              Em pagamento: {divida.numeroParcelas}x{" "}
              {formatarMoeda(divida.valorParcela ?? 0)}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setAtivando(true)}
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              Ativar pagamento mensal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
    >
      <input type="hidden" name="id" value={divida.id} />
      <p className="text-sm text-foreground/70">
        Marcar {formatarMoeda(divida.valor)} como já sendo paga mensalmente.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Número de parcelas</label>
          <input
            name="numeroParcelas"
            type="number"
            step="1"
            min="1"
            required
            className={inputClass}
            placeholder="Ex: 12"
          />
        </div>
        <div>
          <label className={labelClass}>Valor da parcela (opcional)</label>
          <input
            name="valorParcela"
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            placeholder="Calcula automaticamente"
          />
        </div>
      </div>
      {state.error && <p className="text-sm text-warn">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setAtivando(false)}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Confirmar"}
        </button>
      </div>
    </form>
  );
}

function NovaDividaForm() {
  const [state, formAction, pending] = useActionState(criarDivida, initialState);
  const [status, setStatus] = useState<"nao_estruturada" | "em_pagamento">(
    "nao_estruturada",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className={labelClass}>Nova dívida</p>

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
        <label htmlFor="d-status" className={labelClass}>
          Esta dívida já está sendo paga mensalmente?
        </label>
        <select
          id="d-status"
          name="status"
          className={inputClass}
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "nao_estruturada" | "em_pagamento")
          }
        >
          <option value="nao_estruturada">Não, ainda não estruturada</option>
          <option value="em_pagamento">Sim, já em pagamento</option>
        </select>
      </div>

      {status === "em_pagamento" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="d-parcelas" className={labelClass}>
              Número de parcelas
            </label>
            <input
              id="d-parcelas"
              name="numeroParcelas"
              type="number"
              step="1"
              min="1"
              required
              className={inputClass}
              placeholder="Ex: 12"
            />
          </div>
          <div>
            <label htmlFor="d-valor-parcela" className={labelClass}>
              Valor da parcela (opcional)
            </label>
            <input
              id="d-valor-parcela"
              name="valorParcela"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="Calcula automaticamente"
            />
          </div>
        </div>
      )}

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

      {state.error && <p className="text-sm text-warn">{state.error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar dívida"}
        </button>
      </div>
    </form>
  );
}
