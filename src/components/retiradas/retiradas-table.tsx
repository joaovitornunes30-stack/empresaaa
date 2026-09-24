import { formatarData, formatarMoeda } from "@/lib/financeiro";

type Retirada = {
  id: string;
  valor: number;
  data: Date;
  descricao: string | null;
};

export function RetiradasTable({ retiradas }: { retiradas: Retirada[] }) {
  if (retiradas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-foreground/60">Nenhuma retirada registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {retiradas.map((retirada) => (
              <tr key={retirada.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-medium text-foreground">
                  {formatarMoeda(retirada.valor)}
                </td>
                <td className="px-5 py-4 text-foreground/70">{formatarData(retirada.data)}</td>
                <td className="px-5 py-4 text-foreground/60">
                  {retirada.descricao ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
