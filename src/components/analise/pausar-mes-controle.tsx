"use client";

import { useActionState, useState } from "react";
import { pausarMes, reativarMes, type ActionState } from "@/app/(app)/analise/actions";
import { Modal } from "@/components/ui/modal";
import { formatarMesLabel } from "@/lib/analise";

const initialState: ActionState = { error: null };

/**
 * "Pausar um mês": só o dono pausa/reativa (`podeAlterar`) — consultor e
 * membro só enxergam o chip "Mês pausado" quando já está pausado. Pausar
 * não apaga nem esconde nenhum lançamento, só tira o mês das médias e
 * comparações (ver lib/retiradas-calculo.ts e lib/analise.ts).
 */
export function PausarMesControle({
  mes,
  pausado,
  motivo,
  podeAlterar,
  compact = false,
}: {
  mes: string;
  pausado: boolean;
  motivo: string | null;
  podeAlterar: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(pausarMes, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
    }
  }

  if (pausado) {
    return (
      <div className="inline-flex items-center gap-2">
        <span
          title={motivo ? `Motivo: ${motivo}` : "Nenhum motivo informado."}
          className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-semibold text-foreground/70"
        >
          Mês pausado
        </span>
        {podeAlterar && (
          <form action={reativarMes}>
            <input type="hidden" name="mes" value={mes} />
            <button type="submit" className="text-xs font-medium text-primary hover:underline">
              Reativar este mês
            </button>
          </form>
        )}
      </div>
    );
  }

  if (!podeAlterar) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "text-[11px] font-medium text-foreground/40 hover:text-primary-dark hover:underline"
            : "text-xs font-medium text-foreground/50 hover:text-primary-dark hover:underline"
        }
      >
        Pausar este mês
      </button>

      {open && (
        <Modal title={`Pausar ${formatarMesLabel(mes)}`} onClose={() => setOpen(false)}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="mes" value={mes} />
            <p className="text-sm text-foreground/70">
              Tudo bem, meses assim acontecem. Este mês não vai pesar nas
              suas médias, você continua no controle.
            </p>
            <div>
              <label htmlFor="motivo-pausa" className="mb-1.5 block text-sm font-medium text-foreground/80">
                Motivo (opcional)
              </label>
              <textarea
                id="motivo-pausa"
                name="motivo"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: viagem, reforma, licença médica..."
              />
            </div>

            {state.error && (
              <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
            )}

            <div className="mt-1 flex justify-end gap-3">
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
                {pending ? "Pausando..." : "Pausar mês"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
