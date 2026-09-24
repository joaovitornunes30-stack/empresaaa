"use client";

import { useActionState, useState } from "react";
import { definirMetaDoMes, type ActionState } from "@/app/(app)/analise/actions";
import { Modal } from "@/components/ui/modal";
import { formatarMoeda } from "@/lib/financeiro";
import { calcularMetaDoMes } from "@/lib/analise";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

export function MetaDoMesCard({
  mes,
  valorMeta,
  vendasMes,
  somenteLeitura = false,
}: {
  mes: string;
  valorMeta: number | null;
  vendasMes: number;
  somenteLeitura?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(definirMetaDoMes, initialState);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) setOpen(false);
  }

  const meta = valorMeta !== null ? calcularMetaDoMes(vendasMes, valorMeta) : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">
          Meta do Mês
        </h3>
        {!somenteLeitura && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-medium text-primary hover:text-primary-dark"
          >
            {valorMeta === null ? "Definir meta" : "Editar"}
          </button>
        )}
      </div>

      {meta ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-2xl font-bold text-foreground">
              {formatarMoeda(vendasMes)}
            </p>
            <p className="whitespace-nowrap text-sm text-foreground/50">
              de {formatarMoeda(valorMeta as number)}
            </p>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={`h-full rounded-full ${meta.atingiu ? "bg-good" : "bg-primary"}`}
              style={{ width: `${meta.percentual}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-foreground/60">
            <span>{Math.round(meta.percentual)}% da meta</span>
            <span>
              {meta.atingiu ? "Meta batida!" : `Faltam ${formatarMoeda(meta.faltante)}`}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground/50">
            {meta.diasRestantes} {meta.diasRestantes === 1 ? "dia restante" : "dias restantes"}{" "}
            no mês
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-foreground/60">
          Nenhuma meta definida para este mês ainda.
        </p>
      )}

      {open && (
        <Modal title="Meta do mês" onClose={() => setOpen(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="mesReferencia" value={mes} />
            <div>
              <label htmlFor="valorMeta" className={labelClass}>
                Valor da meta (R$)
              </label>
              <input
                id="valorMeta"
                name="valorMeta"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={valorMeta ?? undefined}
                className={inputClass}
                placeholder="0,00"
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
    </div>
  );
}
