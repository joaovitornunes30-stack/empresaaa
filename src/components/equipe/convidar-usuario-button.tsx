"use client";

import { useActionState, useState } from "react";
import { convidarUsuario, type ConvidarState } from "@/app/(app)/equipe/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ConvidarState = { error: null, convite: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

function ConvidarUsuarioForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(convidarUsuario, initialState);

  if (state.convite) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-good-bg px-3 py-2 text-sm text-good">
          {state.convite.senhaTemporaria
            ? "Conta criada com sucesso."
            : "Consultor já cadastrado — acesso concedido a esta clínica."}
        </p>
        <div className="rounded-xl border border-border bg-background p-4 text-sm">
          <p className="mb-1">
            <span className="font-medium text-foreground/70">Nome:</span> {state.convite.nome}
          </p>
          <p className="mb-1">
            <span className="font-medium text-foreground/70">E-mail:</span> {state.convite.email}
          </p>
          {state.convite.senhaTemporaria && (
            <p>
              <span className="font-medium text-foreground/70">Senha temporária:</span>{" "}
              <span className="font-mono font-semibold text-foreground">
                {state.convite.senhaTemporaria}
              </span>
            </p>
          )}
        </div>
        {state.convite.senhaTemporaria && (
          <p className="text-xs text-foreground/50">
            Repasse esta senha para a pessoa — ela não será exibida novamente.
          </p>
        )}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="nome" className={labelClass}>
          Nome
        </label>
        <input id="nome" name="nome" type="text" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="papel" className={labelClass}>
          Papel
        </label>
        <select id="papel" name="papel" required className={inputClass} defaultValue="equipe">
          <option value="equipe">Equipe</option>
          <option value="dono">Dono</option>
          <option value="consultor">Consultor</option>
        </select>
      </div>

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
          {pending ? "Enviando..." : "Convidar"}
        </button>
      </div>
    </form>
  );
}

export function ConvidarUsuarioButton() {
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpenCount((count) => count + 1);
          setOpen(true);
        }}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        Convidar
      </button>

      {open && (
        <Modal title="Convidar para a equipe" onClose={() => setOpen(false)}>
          <ConvidarUsuarioForm key={openCount} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
