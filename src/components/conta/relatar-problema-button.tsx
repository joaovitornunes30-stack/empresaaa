"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { relatarProblema } from "@/app/(app)/conta-actions";
import type { ActionState } from "@/lib/auth";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

/**
 * Botão só abre o menu da conta — quem controla se o modal está aberto é o
 * AccountMenu (ver RelatarProblemaModal abaixo), porque fechar o dropdown ao
 * clicar aqui desmontaria este componente (e o estado do modal junto) antes
 * de ele chegar a aparecer.
 */
export function RelatarProblemaButton({ onAbrir }: { onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="block w-full px-4 py-2 text-left text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary-dark"
    >
      Relatar problema
    </button>
  );
}

/** Renderizado fora do dropdown do AccountMenu, para sobreviver ao fechamento dele. */
export function RelatarProblemaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(relatarProblema, initialState);
  const [enviado, setEnviado] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);
  const pathname = usePathname();

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) setEnviado(true);
  }

  function fechar() {
    setEnviado(false);
    onClose();
  }

  return (
    <>
      {open && (
        <Modal title="Relatar problema" onClose={fechar}>
          {enviado ? (
            <div className="flex flex-col gap-4">
              <p className="rounded-xl bg-good-bg px-3 py-2 text-sm text-good">
                Problema registrado. Obrigado por avisar!
              </p>
              <button
                type="button"
                onClick={fechar}
                className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="tela" value={pathname ?? ""} />
              <div>
                <label htmlFor="mensagem" className="mb-1.5 block text-sm font-medium text-foreground/80">
                  O que aconteceu?
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  rows={5}
                  required
                  maxLength={2000}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Descreva o que você esperava que acontecesse e o que aconteceu de fato."
                />
              </div>

              {state.error && (
                <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fechar}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {pending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
