import { formatarMoeda } from "@/lib/financeiro";

export function MetaLucroTermometro({
  totalMes,
  meta,
}: {
  totalMes: number;
  meta: number;
}) {
  const percentual =
    meta > 0 ? Math.max(0, Math.min(100, (totalMes / meta) * 100)) : 0;
  const atingiu = totalMes >= meta;
  const restante = Math.max(0, meta - totalMes);
  const corFill = atingiu ? "bg-good" : "bg-primary";

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-14 w-4 shrink-0 flex-col items-center justify-end"
        role="img"
        aria-label={`Termômetro da meta de lucro: ${Math.round(percentual)}% atingido`}
      >
        <div className="relative h-11 w-2.5 overflow-hidden rounded-full bg-foreground/10">
          <div
            className={`absolute bottom-0 left-0 w-full rounded-full ${corFill}`}
            style={{ height: `${percentual}%` }}
          />
        </div>
        <div className={`-mt-1 h-4 w-4 shrink-0 rounded-full ${corFill}`} />
      </div>
      <div className="text-xs leading-snug text-foreground/60">
        <p className="text-sm font-semibold text-foreground">
          {Math.round(percentual)}% da meta
        </p>
        <p>Meta do mês: {formatarMoeda(meta)}</p>
        <p>
          {atingiu
            ? "Meta batida! 🎉"
            : `Faltam ${formatarMoeda(restante)}`}
        </p>
      </div>
    </div>
  );
}
