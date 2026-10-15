import type { ItemAtencao } from "@/lib/atencao";

export function PrecisaDeAtencaoLista({ itens }: { itens: ItemAtencao[] }) {
  if (itens.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
        <p className="text-sm text-foreground/60">Nada precisando de atenção agora.</p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 font-display text-base font-semibold text-foreground">Precisa de atenção</h2>
      <ul className="flex flex-col divide-y divide-border">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            <span className="text-sm text-foreground/80">{item.texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
