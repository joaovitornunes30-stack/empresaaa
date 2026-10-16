import { formatarMoeda } from "@/lib/financeiro";
import { FAIXA_SAUDAVEL_MIDIA } from "@/lib/analise";

export function GastoMidiaCard({
  gastoMidia,
  faturamentoMes,
}: {
  gastoMidia: number;
  faturamentoMes: number;
}) {
  const percentual = faturamentoMes > 0 ? (gastoMidia / faturamentoMes) * 100 : 0;
  const min = FAIXA_SAUDAVEL_MIDIA.min * 100;
  const max = FAIXA_SAUDAVEL_MIDIA.max * 100;
  const dentroDaFaixa = percentual >= min && percentual <= max;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
        Gasto com mídia no mês
      </p>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">
        {formatarMoeda(gastoMidia)}
      </p>
      <p className="mt-1 text-sm text-foreground/60">
        {faturamentoMes > 0
          ? `${percentual.toFixed(1)}% do faturamento do mês`
          : "Sem faturamento registrado no mês"}
      </p>
      {faturamentoMes > 0 && (
        <p
          className={`mt-2 text-xs font-medium ${dentroDaFaixa ? "text-good" : "text-warn"}`}
        >
          Faixa saudável de referência: {min}–{max}% do faturamento (
          {dentroDaFaixa ? "dentro da faixa" : "fora da faixa"})
        </p>
      )}
    </div>
  );
}
