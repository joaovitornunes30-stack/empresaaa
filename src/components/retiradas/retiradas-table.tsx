import { formatarData, formatarMoeda } from "@/lib/financeiro";
import { MOTIVO_LABEL } from "@/lib/retiradas";

type Retirada = {
  id: string;
  valor: number;
  data: Date;
  descricao: string | null;
  motivo: string;
  observacao: string | null;
  usuarioId: string | null;
};

export function RetiradasTable({
  retiradas,
  destacadas,
  nomePorDonoId,
}: {
  retiradas: Retirada[];
  destacadas: Set<string>;
  // Presente (com mais de 1 entrada) só quando a clínica tem mais de um
  // dono — nesse caso mostra de qual dono é cada retirada.
  nomePorDonoId: Map<string, string>;
}) {
  const mostrarColunaDono = nomePorDonoId.size > 1;
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
              <th className="px-5 py-3 font-medium">Motivo</th>
              {mostrarColunaDono && <th className="px-5 py-3 font-medium">Dono</th>}
              <th className="px-5 py-3 font-medium">Descrição / observação</th>
            </tr>
          </thead>
          <tbody>
            {retiradas.map((retirada) => {
              const emDestaque = destacadas.has(retirada.id);
              return (
                <tr
                  key={retirada.id}
                  className={`border-b border-border last:border-0 ${
                    emDestaque ? "bg-muted-red-bg/40" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-foreground">
                    {formatarMoeda(retirada.valor)}
                  </td>
                  <td className="px-5 py-4 text-foreground/70">{formatarData(retirada.data)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-semibold text-foreground/70">
                      {MOTIVO_LABEL[retirada.motivo] ?? retirada.motivo}
                    </span>
                    {emDestaque && (
                      <span
                        className="ml-2 inline-flex rounded-full bg-muted-red-bg px-2.5 py-0.5 text-xs font-semibold text-muted-red"
                        title="Feita quando o mês já estava acima do recomendado"
                      >
                        Acima do recomendado
                      </span>
                    )}
                  </td>
                  {mostrarColunaDono && (
                    <td className="px-5 py-4 text-foreground/70">
                      {(retirada.usuarioId && nomePorDonoId.get(retirada.usuarioId)) ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-4 text-foreground/60">
                    {retirada.descricao ?? "—"}
                    {retirada.observacao && (
                      <span className="mt-0.5 block text-xs text-foreground/50">
                        {retirada.observacao}
                      </span>
                    )}
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
