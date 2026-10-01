import { formatarMoeda } from "@/lib/financeiro";

function InfoTooltip({ texto }: { texto: string }) {
  return (
    <span
      title={texto}
      className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-foreground/30 text-[10px] font-semibold leading-none text-foreground/50"
    >
      ?
    </span>
  );
}

export function FaturamentoVsCaixa({
  faturamentoMes,
  caixaMes,
  receitaReconhecidaMes,
}: {
  faturamentoMes: number;
  caixaMes: number;
  receitaReconhecidaMes: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/50">
          Faturamento do mês
          <InfoTooltip texto="Soma do valor total das entradas registradas no mês, independentemente de já terem sido recebidas." />
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-foreground">
          {formatarMoeda(faturamentoMes)}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/50">
          Caixa do mês
          <InfoTooltip texto="Soma das parcelas de vendas pagas com vencimento neste mês — inclui parcelas de vendas de meses anteriores que caem neste mês." />
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-foreground">
          {formatarMoeda(caixaMes)}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/50">
          Receita reconhecida
          <InfoTooltip texto="Soma do valor por sessão de cada Sessão de um Plano entregue neste mês — não muda com antecipação, só quando a sessão é de fato marcada como entregue." />
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-foreground">
          {formatarMoeda(receitaReconhecidaMes)}
        </p>
      </div>
    </div>
  );
}
