import { formatarMoeda } from "@/lib/financeiro";

type Projecao = { dias: number; movimentoLiquido: number; saldoProjetado: number };

export function ProjecaoCaixa({
  saldoAtual,
  projecoes,
}: {
  saldoAtual: number;
  projecoes: Projecao[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
          Saldo atual
        </p>
        <p className="font-display text-2xl font-bold text-foreground">
          {formatarMoeda(saldoAtual)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {projecoes.map((projecao) => (
          <div
            key={projecao.dias}
            className="rounded-xl border border-border bg-background/60 p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              Próximos {projecao.dias} dias
            </p>
            <p
              className={`mt-1 text-sm font-medium ${
                projecao.movimentoLiquido < 0 ? "text-warn" : "text-good"
              }`}
            >
              {projecao.movimentoLiquido >= 0 ? "+" : ""}
              {formatarMoeda(projecao.movimentoLiquido)}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatarMoeda(projecao.saldoProjetado)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
