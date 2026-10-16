import { formatarMesLabel } from "@/lib/analise";

export type EstoqueProduto = {
  id: string;
  nome: string;
  atual: number;
  historico: { mes: string; quantidade: number }[];
};

export function EstoqueSection({ produtos }: { produtos: EstoqueProduto[] }) {
  if (produtos.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        Cadastre produtos para acompanhar o estoque.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {produtos.map((produto) => {
        const maximo = Math.max(1, ...produto.historico.map((h) => h.quantidade));
        return (
          <div
            key={produto.id}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-sm font-medium text-foreground">{produto.nome}</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {produto.atual} un.
            </p>
            <div className="mt-4 flex items-end gap-2" style={{ height: "56px" }}>
              {produto.historico.map((ponto) => (
                <div
                  key={ponto.mes}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    title={`${formatarMesLabel(ponto.mes)}: ${ponto.quantidade} un.`}
                    className="w-full rounded-t bg-primary/70"
                    style={{
                      height:
                        ponto.quantidade > 0
                          ? `${Math.max(4, (ponto.quantidade / maximo) * 44)}px`
                          : "2px",
                    }}
                  />
                  <span className="text-[10px] text-foreground/40">
                    {formatarMesLabel(ponto.mes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
