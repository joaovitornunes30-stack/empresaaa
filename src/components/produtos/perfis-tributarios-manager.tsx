"use client";

import { useActionState, useState } from "react";
import {
  criarPerfilTributario,
  editarPerfilTributario,
  type ActionState,
} from "@/app/produtos/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type Perfil = { id: string; nome: string; aliquota: number };

export function PerfisTributariosManager({ perfis }: { perfis: Perfil[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary-dark"
      >
        Perfis Tributários
      </button>

      {open && (
        <Modal title="Perfis Tributários" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            {perfis.length === 0 && (
              <p className="text-sm text-foreground/60">
                Nenhum perfil cadastrado ainda.
              </p>
            )}
            {perfis.map((perfil) => (
              <PerfilRow key={perfil.id} perfil={perfil} />
            ))}
          </div>

          <div className="my-5 h-px bg-border" />

          <NovoPerfilForm />
        </Modal>
      )}
    </>
  );
}

function PerfilRow({ perfil }: { perfil: Perfil }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    editarPerfilTributario,
    initialState,
  );

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">{perfil.nome}</p>
          <p className="text-xs text-foreground/60">{perfil.aliquota}%</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
    >
      <input type="hidden" name="id" value={perfil.id} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Nome</label>
          <input
            name="nome"
            type="text"
            defaultValue={perfil.nome}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Alíquota (%)</label>
          <input
            name="aliquota"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={perfil.aliquota}
            required
            className={inputClass}
          />
        </div>
      </div>
      {state.error && <p className="text-sm text-warn">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function NovoPerfilForm() {
  const [state, formAction, pending] = useActionState(
    criarPerfilTributario,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className={labelClass}>Novo perfil tributário</p>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="nome"
          type="text"
          required
          placeholder="Nome do perfil"
          className={inputClass}
        />
        <input
          name="aliquota"
          type="number"
          step="0.01"
          min="0"
          max="100"
          required
          placeholder="Alíquota %"
          className={inputClass}
        />
      </div>
      {state.error && <p className="text-sm text-warn">{state.error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar perfil"}
        </button>
      </div>
    </form>
  );
}
