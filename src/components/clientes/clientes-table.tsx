import Link from "next/link";
import { formatarData, formatarMoeda } from "@/lib/financeiro";
import type { StatusCliente } from "@/lib/clientes";
import { AcaoClienteButton } from "@/components/clientes/acao-cliente-button";
import type { PlanoModeloOpcao } from "@/components/clientes/plano-modal-form";

type ClienteLinha = {
  id: string;
  nome: string;
  contato: string | null;
  origem: string | null;
  ultimaVenda: Date | null;
  valorTotalGasto: number;
  status: { cor: StatusCliente; dias: number | null };
  proximoRetornoAtivo: Date | null;
};

const COR_DOT: Record<Exclude<StatusCliente, null>, string> = {
  verde: "bg-good",
  laranja: "bg-accent",
  vermelho: "bg-critical",
};

function StatusDot({ status }: { status: { cor: StatusCliente; dias: number | null } }) {
  if (!status.cor) {
    return (
      <span
        title="Sem venda registrada ainda"
        className="inline-block h-2.5 w-2.5 rounded-full bg-foreground/20"
      />
    );
  }

  const titulo =
    status.dias !== null && status.dias < 0
      ? "Retorno agendado"
      : `há ${status.dias} dias`;

  return (
    <span
      title={titulo}
      className={`inline-block h-2.5 w-2.5 rounded-full ${COR_DOT[status.cor]}`}
    />
  );
}

export function ClientesTable({
  clientes,
  produtos,
  modelos,
}: {
  clientes: ClienteLinha[];
  produtos: { id: string; nome: string }[];
  modelos: PlanoModeloOpcao[];
}) {
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
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Status</span>
              </th>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Contato</th>
              <th className="px-5 py-3 font-medium">Origem</th>
              <th className="px-5 py-3 font-medium">Última venda</th>
              <th className="px-5 py-3 font-medium">Valor total gasto</th>
              <th className="px-5 py-3 font-medium">Plano/Retorno</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">
                  <StatusDot status={cliente.status} />
                </td>
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
                <td className="px-5 py-4 text-foreground/70">
                  {cliente.proximoRetornoAtivo
                    ? formatarData(cliente.proximoRetornoAtivo)
                    : "Sem plano ativo"}
                </td>
                <td className="px-5 py-4 text-right">
                  <AcaoClienteButton
                    clienteId={cliente.id}
                    produtos={produtos}
                    modelos={modelos}
                    nomeCliente={cliente.nome}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
