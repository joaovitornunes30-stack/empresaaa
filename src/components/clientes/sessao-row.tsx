"use client";

import { useActionState, useState } from "react";
import {
  marcarSessaoEntregue,
  marcarSessaoPerdida,
  marcarSessaoPostergada,
  type ActionState,
} from "@/app/clientes/planos/actions";
import { formatarData } from "@/lib/financeiro";

const initialState: ActionState = { error: null };

type Sessao = {
  id: string;
  numero: number;
  dataPrevista: Date;
  status: string;
  dataEntregue: Date | null;
};

const STATUS_BADGE: Record<string, { texto: string; className: string }> = {
  pendente: { texto: "Pendente", className: "bg-foreground/5 text-foreground/70" },
  postergada: { texto: "Postergada", className: "bg-accent-bg text-accent" },
  entregue: { texto: "Entregue", className: "bg-good-bg text-good" },
  perdida: { texto: "Perdida", className: "bg-warn-bg text-warn" },
};

function hojeInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function SessaoRow({ sessao }: { sessao: Sessao }) {
  const [modo, setModo] = useState<"idle" | "nao-entregue" | "postergar">("idle");

  const [entregueState, entregueAction, entreguePending] = useActionState(
    marcarSessaoEntregue,
    initialState,
  );
  const [lastEntregueState, setLastEntregueState] = useState(entregueState);
  if (entregueState !== lastEntregueState) {
    setLastEntregueState(entregueState);
    if (!entregueState.error) setModo("idle");
  }

  const [postergarState, postergarAction, postergarPending] = useActionState(
    marcarSessaoPostergada,
    initialState,
  );
  const [lastPostergarState, setLastPostergarState] = useState(postergarState);
  if (postergarState !== lastPostergarState) {
    setLastPostergarState(postergarState);
    if (!postergarState.error) setModo("idle");
  }

  const acionavel = sessao.status === "pendente" || sessao.status === "postergada";
  const badge = STATUS_BADGE[sessao.status] ?? STATUS_BADGE.pendente;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">Sessão {sessao.numero}</span>
        <span className="text-xs text-foreground/50">{formatarData(sessao.dataPrevista)}</span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.texto}
        </span>
        {sessao.status === "entregue" && sessao.dataEntregue && (
          <span className="text-xs text-foreground/50">
            Entregue em {formatarData(sessao.dataEntregue)}
          </span>
        )}
      </div>

      {acionavel && modo === "idle" && (
        <div className="flex items-center gap-2">
          <form action={entregueAction}>
            <input type="hidden" name="id" value={sessao.id} />
            <input type="hidden" name="dataEntregue" value={hojeInputValue()} />
            <button
              type="submit"
              disabled={entreguePending}
              className="rounded-lg bg-good-bg px-3 py-1.5 text-xs font-semibold text-good hover:opacity-80 disabled:opacity-50"
            >
              Entregue
            </button>
          </form>
          <button
            type="button"
            onClick={() => setModo("nao-entregue")}
            className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-foreground/10"
          >
            Não entregue
          </button>
        </div>
      )}

      {acionavel && modo === "nao-entregue" && (
        <div className="flex items-center gap-2">
          <form action={marcarSessaoPerdida}>
            <input type="hidden" name="id" value={sessao.id} />
            <button
              type="submit"
              className="rounded-lg bg-warn-bg px-3 py-1.5 text-xs font-semibold text-warn hover:opacity-80"
            >
              Perdida
            </button>
          </form>
          <button
            type="button"
            onClick={() => setModo("postergar")}
            className="rounded-lg bg-accent-bg px-3 py-1.5 text-xs font-semibold text-accent hover:opacity-80"
          >
            Postergada
          </button>
          <button
            type="button"
            onClick={() => setModo("idle")}
            className="text-xs font-medium text-foreground/50 hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      )}

      {acionavel && modo === "postergar" && (
        <form action={postergarAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={sessao.id} />
          <input
            type="date"
            name="novaDataPrevista"
            required
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={postergarPending}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setModo("idle")}
            className="text-xs font-medium text-foreground/50 hover:text-foreground"
          >
            Cancelar
          </button>
        </form>
      )}

      {(entregueState.error || postergarState.error) && (
        <p className="text-xs text-warn">{entregueState.error ?? postergarState.error}</p>
      )}
    </div>
  );
}
