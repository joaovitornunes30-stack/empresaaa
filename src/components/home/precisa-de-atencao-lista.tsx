import Link from "next/link";
import type { ItemAtencao } from "@/lib/atencao";

const ROTA_HREF: Record<ItemAtencao["rota"], string> = {
  analise: "/analise",
  produtos: "/produtos",
  clientes: "/clientes",
  financeiro: "/financeiro",
  retiradas: "/retiradas",
};

export function PrecisaDeAtencaoLista({ itens }: { itens: ItemAtencao[] }) {
  if (itens.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
        <p className="text-sm text-foreground/60">Tudo em dia por aqui.</p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 font-display text-base font-semibold text-foreground">Precisa de atenção</h2>
      <ul className="flex flex-col divide-y divide-border">
        {itens.map((item) => (
          <li key={item.id}>
            <Link
              href={ROTA_HREF[item.rota]}
              className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 hover:text-primary-dark"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${item.fixo ? "bg-accent" : "bg-foreground/30"}`} />
              <span className="text-sm text-foreground/80">{item.texto}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
