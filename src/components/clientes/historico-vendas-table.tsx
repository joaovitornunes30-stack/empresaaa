import { formatarData, formatarMoeda } from "@/lib/financeiro";

type VendaHistorico = {
  id: string;
  valor: number;
  data: Date;
  fechadoPor: string | null;
  fechadoPorUsuario: { nome: string } | null;
  dataProximoRetorno: Date | null;
  produto: { nome: string } | null;
};

export function HistoricoVendasTable({ vendas }: { vendas: VendaHistorico[] }) {
  if (vendas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-foreground/60">Nenhuma venda registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-5 py-3 font-medium">Produto</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Fechado por</th>
              <th className="px-5 py-3 font-medium">Próximo retorno</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((venda) => (
              <tr key={venda.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4 text-foreground/70">
                  {venda.produto?.nome ?? "—"}
                </td>
                <td className="px-5 py-4 font-medium text-foreground">
                  {formatarMoeda(venda.valor)}
                </td>
                <td className="px-5 py-4 text-foreground/70">{formatarData(venda.data)}</td>
                <td className="px-5 py-4 text-foreground/70">
                  {venda.fechadoPorUsuario?.nome ?? venda.fechadoPor ?? "—"}
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {venda.dataProximoRetorno ? formatarData(venda.dataProximoRetorno) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
