import { marcarParcelaPaga } from "@/app/(app)/financeiro/actions";
import { formatarData, formatarMoeda, parcelaVencida } from "@/lib/financeiro";
import { MetaLucroTermometro } from "@/components/financeiro/meta-lucro-termometro";
import { DefinirMetaButton } from "@/components/financeiro/definir-meta-button";
import { EditarValorLancamento } from "@/components/financeiro/editar-valor-lancamento";

type Parcela = {
  id: string;
  numeroParcela: number;
  status: string;
  dataVencimento: Date;
};

type EntradaSaida = {
  id: string;
  tipo: string;
  categoria: string;
  valor: number;
  data: Date;
  descricao: string | null;
  nomePrestador: string | null;
  parcelas: Parcela[];
  funcionarioId: string | null;
  despesaAdministrativaId: string | null;
};

export function EntradasSaidasTable({
  itens,
  mes,
  meta,
}: {
  itens: EntradaSaida[];
  mes: string;
  meta: number | null;
}) {
  const totalMes = itens.reduce((total, item) => {
    return item.tipo === "entrada" ? total + item.valor : total - item.valor;
  }, 0);

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-display text-base font-semibold text-foreground">
          Entradas e Saídas
        </h2>
        <form className="flex items-center gap-2" method="get">
          <input
            type="month"
            name="mes"
            defaultValue={mes}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-primary hover:text-primary-dark"
          >
            Filtrar
          </button>
        </form>
      </div>

      {itens.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-foreground/60">
          Nenhuma entrada ou saída registrada neste mês.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Descrição</th>
                <th className="px-5 py-3 font-medium">Parcelas</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const pagas = item.parcelas.filter(
                  (parcela) => parcela.status === "pago",
                ).length;
                const proximaPendente = item.parcelas
                  .filter((parcela) => parcela.status === "pendente")
                  .sort((a, b) => a.numeroParcela - b.numeroParcela)[0];
                const vencida = proximaPendente
                  ? parcelaVencida(proximaPendente)
                  : false;

                return (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.tipo === "entrada"
                            ? "bg-good-bg text-good"
                            : "bg-foreground/5 text-foreground/70"
                        }`}
                      >
                        {item.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-foreground/70">
                      {item.categoria}
                      {item.nomePrestador && (
                        <span className="text-foreground/50">
                          {" "}
                          · {item.nomePrestador}
                        </span>
                      )}
                      {(item.funcionarioId || item.despesaAdministrativaId) && (
                        <span className="ml-2 inline-flex rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/50">
                          Automático
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      <div className="flex flex-col gap-1">
                        <span>{formatarMoeda(item.valor)}</span>
                        {(item.funcionarioId || item.despesaAdministrativaId) && (
                          <EditarValorLancamento id={item.id} valorAtual={item.valor} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground/70">
                      {formatarData(item.data)}
                    </td>
                    <td className="px-5 py-4 text-foreground/60">
                      {item.descricao ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-foreground/70">
                      {item.parcelas.length === 0 ? (
                        "À vista"
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span>
                            {pagas}/{item.parcelas.length} pagas
                          </span>
                          {proximaPendente && (
                            <div className="flex items-center gap-2">
                              {vencida && (
                                <span className="rounded-full bg-warn-bg px-2 py-0.5 text-xs font-semibold text-warn">
                                  vencida
                                </span>
                              )}
                              <form action={marcarParcelaPaga}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={proximaPendente.id}
                                />
                                <button
                                  type="submit"
                                  className="text-xs font-medium text-primary hover:text-primary-dark"
                                >
                                  Marcar parcela {proximaPendente.numeroParcela}{" "}
                                  como paga
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
        <div>{meta === null && <DefinirMetaButton mes={mes} metaAtual={null} />}</div>
        <div className="flex items-center gap-4">
          {meta !== null && (
            <MetaLucroTermometro totalMes={totalMes} meta={meta} />
          )}
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              Total do mês
            </p>
            <p
              className={`font-display text-lg font-bold ${
                totalMes < 0 ? "text-warn" : "text-foreground"
              }`}
            >
              {formatarMoeda(totalMes)}
            </p>
            {meta !== null && (
              <DefinirMetaButton mes={mes} metaAtual={meta} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
