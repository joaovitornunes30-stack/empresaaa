import {
  calcularSaldoDevedor,
  contarParcelasPagas,
  formatarData,
  formatarMoeda,
  type DividaComParcelas,
} from "@/lib/financeiro";

type Divida = DividaComParcelas & {
  id: string;
  dataVencimento: Date;
  descricao: string | null;
};

export function TodasDividasTable({ dividas }: { dividas: Divida[] }) {
  if (dividas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-foreground/60">
          Nenhuma dívida cadastrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Valor total</th>
              <th className="px-5 py-3 font-medium">Saldo devedor</th>
              <th className="px-5 py-3 font-medium">Parcelas</th>
            </tr>
          </thead>
          <tbody>
            {dividas.map((divida) => {
              const saldoDevedor = calcularSaldoDevedor(divida);
              const { pagas, total } = contarParcelasPagas(divida);
              const emPagamento = divida.status === "em_pagamento";

              return (
                <tr key={divida.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-medium text-foreground">
                    {divida.descricao ?? "—"}
                    <p className="text-xs font-normal text-foreground/50">
                      Vencimento {formatarData(divida.dataVencimento)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        emPagamento
                          ? "bg-good-bg text-good"
                          : "bg-foreground/5 text-foreground/70"
                      }`}
                    >
                      {emPagamento ? "Em pagamento" : "Não estruturada"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-foreground/70">
                    {formatarMoeda(divida.valor)}
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground">
                    {formatarMoeda(saldoDevedor)}
                  </td>
                  <td className="px-5 py-4 text-foreground/70">
                    {emPagamento ? `${pagas}/${total}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
