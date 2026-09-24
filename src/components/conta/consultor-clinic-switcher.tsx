"use client";

import { useTransition } from "react";
import { trocarClinicaConsultor } from "@/app/(app)/conta-actions";

export function ConsultorClinicSwitcher({
  clinicas,
  clinicaAtivaId,
}: {
  clinicas: { id: string; nome: string }[];
  clinicaAtivaId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
        Modo Consultor
      </span>
      <select
        value={clinicaAtivaId}
        disabled={pending || clinicas.length <= 1}
        onChange={(event) => {
          const clinicaId = event.target.value;
          startTransition(() => {
            trocarClinicaConsultor(clinicaId);
          });
        }}
        className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
      >
        {clinicas.map((clinica) => (
          <option key={clinica.id} value={clinica.id}>
            {clinica.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
