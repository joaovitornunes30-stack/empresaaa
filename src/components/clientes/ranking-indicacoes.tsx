"use client";

import { useState } from "react";
import type { ClienteComContagem } from "@/lib/clientes";

const QUANTIDADE_PADRAO = 3;

export function RankingIndicacoes({ ranking }: { ranking: ClienteComContagem[] }) {
  const [expandido, setExpandido] = useState(false);

  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-foreground/60">
          Nenhuma indicação registrada ainda.
        </p>
      </div>
    );
  }

  const visiveis = expandido ? ranking : ranking.slice(0, QUANTIDADE_PADRAO);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <ol className="flex flex-col gap-2.5">
        {visiveis.map((cliente, index) => (
          <li
            key={cliente.id}
            className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-dark">
                {index + 1}
              </span>
              <span className="font-medium text-foreground">{cliente.nome}</span>
            </span>
            <span className="text-sm text-foreground/60">
              {cliente.totalIndicados}{" "}
              {cliente.totalIndicados === 1 ? "indicação" : "indicações"}
            </span>
          </li>
        ))}
      </ol>

      {ranking.length > QUANTIDADE_PADRAO && (
        <button
          type="button"
          onClick={() => setExpandido((atual) => !atual)}
          className="mt-3 text-xs font-medium text-primary hover:text-primary-dark"
        >
          {expandido ? "Ver menos" : `Ver mais (${ranking.length - QUANTIDADE_PADRAO})`}
        </button>
      )}
    </div>
  );
}
