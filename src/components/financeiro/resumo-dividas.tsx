import { PRAZO_LABEL, formatarMoeda, type Prazo } from "@/lib/financeiro";

const ORDEM: Prazo[] = ["curto", "medio", "longo"];

export function ResumoDividas({ totais }: { totais: Record<Prazo, number> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {ORDEM.map((prazo) => (
        <div
          key={prazo}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {PRAZO_LABEL[prazo]}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(totais[prazo])}
          </p>
        </div>
      ))}
    </div>
  );
}
