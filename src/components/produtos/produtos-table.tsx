import {
  calcularMargemContribuicao,
  formatarMoeda,
  formatarPercentual,
  nivelMargem,
} from "@/lib/calculos";

type Produto = {
  id: string;
  nome: string;
  precoVenda: number;
  custoMedioMaterial: number;
  perfilTributario: { nome: string; aliquota: number };
};

export function ProdutosTable({ produtos }: { produtos: Produto[] }) {
  if (produtos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm text-foreground/60">
          Nenhum produto cadastrado ainda. Clique em &quot;Novo Produto&quot;
          para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
            <th className="px-5 py-3 font-medium">Produto</th>
            <th className="px-5 py-3 font-medium">Perfil tributário</th>
            <th className="px-5 py-3 font-medium">Preço de venda</th>
            <th className="px-5 py-3 font-medium">Custo material</th>
            <th className="px-5 py-3 font-medium">Margem de contribuição</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => {
            const { margemReais, margemPercentual } =
              calcularMargemContribuicao(produto);
            const nivel = nivelMargem(margemPercentual);

            return (
              <tr key={produto.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-medium text-foreground">
                  {produto.nome}
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {produto.perfilTributario.nome} (
                  {produto.perfilTributario.aliquota}%)
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {formatarMoeda(produto.precoVenda)}
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {formatarMoeda(produto.custoMedioMaterial)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      nivel === "boa"
                        ? "bg-good-bg text-good"
                        : "bg-warn-bg text-warn"
                    }`}
                  >
                    {formatarPercentual(margemPercentual)} ·{" "}
                    {formatarMoeda(margemReais)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
