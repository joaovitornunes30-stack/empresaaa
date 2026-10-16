import { formatarMoeda } from "@/lib/financeiro";
import type { FatiaComposicao } from "@/lib/analise";

// Paleta categórica fixa (nunca reordenada por valor) — a cor de cada
// produto é estável por id via hash, não pela posição no ranking do mês.
const PALETA = [
  "#6D28D9", // primary
  "#0D9488", // teal
  "#2563EB", // blue
  "#BE185D", // rose
  "#65A30D", // olive
  "#0EA5E9", // sky
  "#7C3AED", // violet
];
const COR_OUTROS = "#94A3B8";

function corParaProduto(produtoId: string | null) {
  if (produtoId === null) return COR_OUTROS;
  let hash = 0;
  for (let i = 0; i < produtoId.length; i++) {
    hash = (hash * 31 + produtoId.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}

export function ComposicaoFaturamento({ fatias }: { fatias: FatiaComposicao[] }) {
  if (fatias.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        Nenhuma entrada registrada neste mês.
      </p>
    );
  }

  const raio = 58;
  const centro = 70;
  const espessura = 22;
  const circunferencia = 2 * Math.PI * raio;

  const fatiasComOffset = fatias.map((fatia, index) => {
    const percentualAnterior = fatias
      .slice(0, index)
      .reduce((soma, anterior) => soma + anterior.percentual, 0);
    return {
      fatia,
      comprimento: (fatia.percentual / 100) * circunferencia,
      offset: (percentualAnterior / 100) * circunferencia,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        role="img"
        aria-label="Composição do faturamento por produto"
        className="shrink-0"
      >
        <circle
          cx={centro}
          cy={centro}
          r={raio}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={espessura}
        />
        {fatiasComOffset.map(({ fatia, comprimento, offset }) => {
          const cor = corParaProduto(fatia.produtoId);
          return (
            <circle
              key={fatia.produtoId ?? "outros"}
              cx={centro}
              cy={centro}
              r={raio}
              fill="none"
              stroke={cor}
              strokeWidth={espessura}
              strokeDasharray={`${comprimento} ${circunferencia - comprimento}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${centro} ${centro})`}
            >
              <title>
                {`${fatia.nome}: ${formatarMoeda(fatia.valor)} (${fatia.percentual.toFixed(0)}%)`}
              </title>
            </circle>
          );
        })}
      </svg>
      <ul className="flex flex-col gap-2 text-sm">
        {fatias.map((fatia) => (
          <li
            key={fatia.produtoId ?? "outros"}
            className="flex items-center gap-2"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: corParaProduto(fatia.produtoId) }}
            />
            <span className="text-foreground/80">{fatia.nome}</span>
            <span className="text-foreground/50">
              {fatia.percentual.toFixed(0)}% · {formatarMoeda(fatia.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
