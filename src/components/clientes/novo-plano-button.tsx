"use client";

import { useState } from "react";
import { PlanoModalForm, type PlanoModeloOpcao } from "@/components/clientes/plano-modal-form";

export function NovoPlanoButton({
  produtos,
  modelos,
  clientes,
}: {
  produtos: { id: string; nome: string }[];
  modelos: PlanoModeloOpcao[];
  clientes?: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        + Novo Plano
      </button>

      {open && (
        <PlanoModalForm
          produtos={produtos}
          modelos={modelos}
          clientes={clientes}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
