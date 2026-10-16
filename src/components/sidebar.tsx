"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Aba } from "@/lib/permissoes";

type NavItem = {
  label: string;
  href: string;
  aba: Aba;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", aba: "home" },
  { label: "Análise", href: "/analise", aba: "analise" },
  { label: "Produtos", href: "/produtos", aba: "produtos" },
  { label: "Clientes", href: "/clientes", aba: "clientes" },
  { label: "Financeiro", href: "/financeiro", aba: "financeiro" },
  { label: "Retiradas", href: "/retiradas", aba: "retiradas" },
  { label: "Notícias", href: "/noticias", aba: "noticias" },
];

export function Sidebar({ abasPermitidas }: { abasPermitidas: Aba[] }) {
  const pathname = usePathname();
  const itens = NAV_ITEMS.filter((item) => abasPermitidas.includes(item.aba));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sm:flex">
      <div className="mb-8 px-2">
        <span className="font-display text-xl font-bold text-primary-dark">
          Aivy
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {itens.map((item) => {
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-primary/10 hover:text-primary-dark"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto px-2 pt-6 text-xs text-foreground/40">
        <Link href="/termos" className="hover:text-foreground/70">Termos</Link>
        {" · "}
        <Link href="/privacidade" className="hover:text-foreground/70">Privacidade</Link>
      </p>
    </aside>
  );
}
