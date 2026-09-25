"use client";

import { useActionState, useState } from "react";
import {
  alternarAtivoDespesaAdministrativa,
  criarDespesaAdministrativa,
  marcarDespesaAdministrativaPaga,
  type ActionState,
} from "@/app/(app)/financeiro/actions";
import { Modal } from "@/components/ui/modal";
import { FREQUENCIA_LABEL, formatarData, formatarMoeda } from "@/lib/financeiro";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type DespesaAdministrativa = {
  id: string;
  nome: string;
  recorrente: boolean;
  frequencia: string | null;
  valor: number;
  dataInicio: Date | null;
  data: Date | null;
  status: string;
  ativo: boolean;
};

export function DespesasAdministrativasManager({
  despesas,
}: {
  despesas: DespesaAdministrativa[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary-dark"
      >
        Despesas Administrativas
      </button>

      {open && (
        <Modal title="Despesas Administrativas" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            {despesas.length === 0 && (
              <p className="text-sm text-foreground/60">
                Nenhuma despesa administrativa cadastrada ainda.
              </p>
            )}
            {despesas.map((despesa) => (
              <DespesaRow key={despesa.id} despesa={despesa} />
            ))}
          </div>

          <div className="my-5 h-px bg-border" />

          <NovaDespesaAdministrativaForm />
        </Modal>
      )}
    </>
  );
}

function DespesaRow({ despesa }: { despesa: DespesaAdministrativa }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        despesa.ativo ? "border-border" : "border-border bg-foreground/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {despesa.nome}
            {!despesa.ativo && (
              <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground/60">
                Inativa
              </span>
            )}
          </p>
          <p className="text-xs text-foreground/60">
            {formatarMoeda(despesa.valor)}
            {despesa.recorrente
              ? ` · Recorrente (${FREQUENCIA_LABEL[despesa.frequencia ?? ""] ?? despesa.frequencia}) desde ${
                  despesa.dataInicio ? formatarData(despesa.dataInicio) : "—"
                }`
              : ` · Avulsa em ${despesa.data ? formatarData(despesa.data) : "—"}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!despesa.recorrente &&
            (despesa.status === "pago" ? (
              <span className="rounded-full bg-good-bg px-3 py-1 text-xs font-semibold text-good">
                Pago
              </span>
            ) : (
              <form action={marcarDespesaAdministrativaPaga}>
                <input type="hidden" name="id" value={despesa.id} />
                <button
                  type="submit"
                  className="rounded-full bg-warn-bg px-3 py-1 text-xs font-semibold text-warn hover:opacity-80"
                >
                  Pendente · marcar como pago
                </button>
              </form>
            ))}
          <form action={alternarAtivoDespesaAdministrativa}>
            <input type="hidden" name="id" value={despesa.id} />
            <button
              type="submit"
              className="text-sm font-medium text-foreground/60 hover:text-foreground"
            >
              {despesa.ativo ? "Desativar" : "Reativar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function NovaDespesaAdministrativaForm() {
  const [state, formAction, pending] = useActionState(criarDespesaAdministrativa, initialState);
  const [recorrente, setRecorrente] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className={labelClass}>Nova Despesa Administrativa</p>

      <div>
        <label htmlFor="da-nome" className={labelClass}>
          Nome
        </label>
        <input id="da-nome" name="nome" type="text" required className={inputClass} />
      </div>

      <div>
        <label htmlFor="da-valor" className={labelClass}>
          Valor (R$)
        </label>
        <input
          id="da-valor"
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
        <label htmlFor="da-recorrente" className={labelClass}>
          É recorrente?
        </label>
        <select
          id="da-recorrente"
          name="recorrente"
          className={inputClass}
          value={recorrente ? "on" : ""}
          onChange={(event) => setRecorrente(event.target.value === "on")}
        >
          <option value="">Não</option>
          <option value="on">Sim</option>
        </select>
      </div>

      {recorrente ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="da-frequencia" className={labelClass}>
              Frequência
            </label>
            <select id="da-frequencia" name="frequencia" required className={inputClass} defaultValue="mensal">
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
              <option value="60dias">A cada 60 dias</option>
            </select>
          </div>
          <div>
            <label htmlFor="da-data-inicio" className={labelClass}>
              Data de início
            </label>
            <input
              id="da-data-inicio"
              name="dataInicio"
              type="date"
              required
              className={inputClass}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="da-data" className={labelClass}>
              Data
            </label>
            <input id="da-data" name="data" type="date" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="da-status" className={labelClass}>
              Status
            </label>
            <select id="da-status" name="status" className={inputClass} defaultValue="pendente">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-warn">{state.error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar despesa"}
        </button>
      </div>
    </form>
  );
}
