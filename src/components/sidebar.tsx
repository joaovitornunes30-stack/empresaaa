"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@/lib/tenant-context";

type NavItem = {
  label: string;
  href: string;
  papeis: Papel[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Análise", href: "/analise", papeis: ["dono", "consultor"] },
  { label: "Produtos", href: "/produtos", papeis: ["dono", "equipe", "consultor"] },
  { label: "Clientes", href: "/clientes", papeis: ["dono", "equipe", "consultor"] },
  { label: "Financeiro", href: "/financeiro", papeis: ["dono", "consultor"] },
  { label: "Retiradas", href: "/retiradas", papeis: ["dono", "consultor"] },
];

export function Sidebar({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const itens = NAV_ITEMS.filter((item) => item.papeis.includes(papel));

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
    </aside>
  );
}
