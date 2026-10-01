import Link from "next/link";

export function SessoesPendentesCard({ quantidade }: { quantidade: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Sessões pendentes este mês
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {quantidade}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Previstas para o mês e ainda sem baixa (entregue ou perdida).
          </p>
        </div>
        <Link
          href="/clientes/planos"
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          Ver planos
        </Link>
      </div>
    </div>
  );
}
