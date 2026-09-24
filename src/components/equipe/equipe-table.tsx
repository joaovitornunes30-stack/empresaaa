"use client";

import { useActionState, useRef } from "react";
import { alterarPapelUsuario, alternarAtivoUsuario, type ActionState } from "@/app/(app)/equipe/actions";

const initialState: ActionState = { error: null };

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
};

const PAPEL_LABEL: Record<string, string> = {
  dono: "Dono",
  equipe: "Equipe",
  consultor: "Consultor",
};

function PapelSelect({ usuario, souEuMesmo }: { usuario: Usuario; souEuMesmo: boolean }) {
  const [state, formAction, pending] = useActionState(alterarPapelUsuario, initialState);

  if (souEuMesmo) {
    return <span className="text-sm text-foreground/70">{PAPEL_LABEL[usuario.papel]}</span>;
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={usuario.id} />
      <select
        name="papel"
        defaultValue={usuario.papel}
        disabled={pending}
        onChange={(event) => event.target.form?.requestSubmit()}
        className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="equipe">Equipe</option>
        <option value="dono">Dono</option>
      </select>
      {state.error && <span className="text-xs text-warn">{state.error}</span>}
    </form>
  );
}

function AtivoToggle({ usuario, souEuMesmo }: { usuario: Usuario; souEuMesmo: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  if (souEuMesmo) return null;

  return (
    <form ref={formRef} action={alternarAtivoUsuario}>
      <input type="hidden" name="id" value={usuario.id} />
      <button
        type="submit"
        className={`text-xs font-medium hover:underline ${usuario.ativo ? "text-warn" : "text-primary"}`}
      >
        {usuario.ativo ? "Desativar" : "Reativar"}
      </button>
    </form>
  );
}

export function EquipeTable({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: Usuario[];
  usuarioAtualId: string;
}) {
  if (usuarios.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground/60">
        Nenhum usuário cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
            <th className="px-5 py-3 font-medium">Nome</th>
            <th className="px-5 py-3 font-medium">E-mail</th>
            <th className="px-5 py-3 font-medium">Papel</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => {
            const souEuMesmo = usuario.id === usuarioAtualId;
            return (
              <tr key={usuario.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-foreground">
                  {usuario.nome}
                  {souEuMesmo && <span className="ml-1.5 text-xs text-foreground/40">(você)</span>}
                </td>
                <td className="px-5 py-3 text-foreground/70">{usuario.email}</td>
                <td className="px-5 py-3">
                  <PapelSelect usuario={usuario} souEuMesmo={souEuMesmo} />
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      usuario.ativo ? "bg-good-bg text-good" : "bg-warn-bg text-warn"
                    }`}
                  >
                    {usuario.ativo ? "Ativo" : "Desativado"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <AtivoToggle usuario={usuario} souEuMesmo={souEuMesmo} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
