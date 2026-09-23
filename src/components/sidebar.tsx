"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  enabled: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Análise", href: "/analise", enabled: true },
  { label: "Produtos", href: "/produtos", enabled: true },
  { label: "Clientes", href: "/clientes", enabled: true },
  { label: "Financeiro", href: "/financeiro", enabled: true },
  { label: "Retiradas", href: "/retiradas", enabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sm:flex">
      <div className="mb-8 px-2">
        <span className="font-display text-xl font-bold text-primary-dark">
          Aivy
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="cursor-not-allowed rounded-xl px-3 py-2 text-sm text-foreground/35"
                title="Em breve"
              >
                {item.label}
              </span>
            );
          }

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
