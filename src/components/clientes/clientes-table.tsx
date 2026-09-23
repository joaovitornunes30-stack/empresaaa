import Link from "next/link";
import { formatarData, formatarMoeda } from "@/lib/financeiro";

type ClienteLinha = {
  id: string;
  nome: string;
  contato: string | null;
  origem: string | null;
  ultimaVenda: Date | null;
  valorTotalGasto: number;
};

export function ClientesTable({ clientes }: { clientes: ClienteLinha[] }) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-foreground/60">Nenhum cliente cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Contato</th>
              <th className="px-5 py-3 font-medium">Origem</th>
              <th className="px-5 py-3 font-medium">Última venda</th>
              <th className="px-5 py-3 font-medium">Valor total gasto</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-medium text-foreground">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="hover:text-primary-dark hover:underline"
                  >
                    {cliente.nome}
                  </Link>
                </td>
                <td className="px-5 py-4 text-foreground/70">{cliente.contato ?? "—"}</td>
                <td className="px-5 py-4 text-foreground/70">{cliente.origem ?? "—"}</td>
                <td className="px-5 py-4 text-foreground/70">
                  {cliente.ultimaVenda ? formatarData(cliente.ultimaVenda) : "—"}
                </td>
                <td className="px-5 py-4 font-medium text-foreground">
                  {formatarMoeda(cliente.valorTotalGasto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
