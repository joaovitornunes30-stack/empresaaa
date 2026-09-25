"use client";

import { useActionState, useState } from "react";
import { editarPermissoesUsuario, type ActionState } from "@/app/(app)/equipe/actions";
import { Modal } from "@/components/ui/modal";
import {
  PermissoesFields,
  PERMISSOES_VAZIAS,
  type PermissoesValues,
} from "@/components/equipe/permissoes-fields";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type Usuario = {
  id: string;
  nome: string;
  cargo: string | null;
  permissoes: PermissoesValues | null;
};

function EditarPermissoesForm({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(editarPermissoesUsuario, initialState);
  const [permissoes, setPermissoes] = useState<PermissoesValues>(
    usuario.permissoes ?? PERMISSOES_VAZIAS,
  );
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) onClose();
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={usuario.id} />

      <div>
        <label htmlFor="cargo-editar" className={labelClass}>
          Cargo
        </label>
        <input
          id="cargo-editar"
          name="cargo"
          type="text"
          defaultValue={usuario.cargo ?? ""}
          className={inputClass}
          placeholder='Ex: "Vendedora", "Secretária", "Financeiro"'
        />
      </div>

      <PermissoesFields value={permissoes} onChange={setPermissoes} />

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
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function EditarPermissoesButton({ usuario }: { usuario: Usuario }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Editar permissões
      </button>

      {open && (
        <Modal title={`Permissões — ${usuario.nome}`} onClose={() => setOpen(false)}>
          <EditarPermissoesForm usuario={usuario} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
