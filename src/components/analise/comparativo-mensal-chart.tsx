import { formatarMoeda } from "@/lib/financeiro";
import { formatarMesLabel, type PontoComparativo } from "@/lib/analise";
import { PausarMesControle } from "@/components/analise/pausar-mes-controle";

export function ComparativoMensalChart({
  pontos,
  podeAlterarPausa,
}: {
  pontos: PontoComparativo[];
  podeAlterarPausa: boolean;
}) {
  const maximo = Math.max(1, ...pontos.flatMap((p) => [p.faturamento, p.despesas]));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-4 text-xs text-foreground/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          Faturamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/30" />
          Despesas
        </span>
      </div>
      <div className="flex items-end justify-between gap-3" style={{ height: "170px" }}>
        {pontos.map((ponto) => (
          <div key={ponto.mes} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`flex w-full items-end justify-center gap-1 ${ponto.pausado ? "opacity-40" : ""}`}
              style={{ height: "140px" }}
            >
              <div
                title={`Faturamento em ${formatarMesLabel(ponto.mes)}: ${formatarMoeda(ponto.faturamento)}`}
                className="w-3 rounded-t bg-primary sm:w-4"
                style={{ height: `${Math.max(2, (ponto.faturamento / maximo) * 140)}px` }}
              />
              <div
                title={`Despesas em ${formatarMesLabel(ponto.mes)}: ${formatarMoeda(ponto.despesas)}`}
                className="w-3 rounded-t bg-foreground/30 sm:w-4"
                style={{ height: `${Math.max(2, (ponto.despesas / maximo) * 140)}px` }}
              />
            </div>
            <span className="text-[11px] text-foreground/50">
              {formatarMesLabel(ponto.mes)}
            </span>
            <PausarMesControle
              mes={ponto.mes}
              pausado={ponto.pausado}
              motivo={ponto.motivoPausa}
              podeAlterar={podeAlterarPausa}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  );
}
