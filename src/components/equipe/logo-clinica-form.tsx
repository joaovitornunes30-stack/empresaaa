"use client";

import { useActionState, useRef, useState } from "react";
import { salvarLogoClinica, removerLogoClinica, type ActionState } from "@/app/(app)/minha-clinica/actions";

const initialState: ActionState = { error: null };

export function LogoClinicaForm({ logoUrlAtual }: { logoUrlAtual: string | null }) {
  const [state, formAction, pending] = useActionState(salvarLogoClinica, initialState);
  const [, removerAction, removendoPending] = useActionState(removerLogoClinica, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function aoEscolherArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
  }

  const logoParaMostrar = preview ?? logoUrlAtual;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-base font-semibold text-foreground">Logo da clínica</h2>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
          {logoParaMostrar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoParaMostrar} alt="Logo da clínica" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-foreground/40">Sem logo</span>
          )}
        </div>

        <form action={formAction} className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={aoEscolherArquivo}
            className="block w-full text-sm text-foreground/70 file:mr-3 file:rounded-xl file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-dark hover:file:bg-primary/20"
          />
          <p className="text-xs text-foreground/50">PNG, JPG ou SVG, até 1 MB.</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {pending ? "Enviando..." : "Enviar logo"}
            </button>
            {logoUrlAtual && (
              <button
                type="submit"
                formAction={removerAction}
                disabled={removendoPending}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/5 disabled:opacity-60"
              >
                Remover
              </button>
            )}
          </div>
        </form>
      </div>

      {state.error && <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>}
    </div>
  );
}
