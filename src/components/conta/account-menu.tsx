"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Papel } from "@/lib/tenant-context";
import { sair } from "@/app/(app)/conta-actions";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function AccountMenu({ nome, papel }: { nome: string; papel: Papel }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("click", aoClicarFora);
    return () => document.removeEventListener("click", aoClicarFora);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-foreground/80 hover:bg-foreground/5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {iniciais(nome)}
        </span>
        <span className="hidden sm:inline">{nome}</span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-border bg-surface py-1.5 shadow-lg">
          {papel === "dono" && (
            <Link
              href="/equipe"
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary-dark"
            >
              Equipe
            </Link>
          )}
          {papel === "dono" && (
            <Link
              href="/minha-clinica"
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary-dark"
            >
              Minha Clínica
            </Link>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="block w-full px-4 py-2 text-left text-sm text-warn hover:bg-warn-bg"
            >
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
