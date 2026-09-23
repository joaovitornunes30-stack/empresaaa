import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calcularValorTotalGasto } from "@/lib/clientes";
import { formatarData, formatarMoeda } from "@/lib/financeiro";
import { HistoricoVendasTable } from "@/components/clientes/historico-vendas-table";
import { NovaVendaClienteButton } from "@/components/clientes/nova-venda-cliente-button";
import { EditarClienteButton } from "@/components/clientes/novo-cliente-button";

export const dynamic = "force-dynamic";

export default async function ClienteDetalhePage(
  props: PageProps<"/clientes/[id]">,
) {
  const { id } = await props.params;

  const [cliente, produtos, todosClientes] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id },
      include: {
        indicadoPor: { select: { id: true, nome: true } },
        indicados: { select: { id: true, nome: true } },
        entradasSaida: {
          where: { tipo: "entrada" },
          orderBy: { data: "desc" },
          include: { produto: { select: { nome: true } } },
        },
      },
    }),
    prisma.produto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  if (!cliente) notFound();

  const valorTotalGasto = calcularValorTotalGasto(cliente.entradasSaida);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <Link
        href="/clientes"
        className="mb-4 inline-block text-sm font-medium text-foreground/60 hover:text-primary-dark"
      >
        &larr; Voltar para Clientes
      </Link>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">{cliente.nome}</h1>
            <EditarClienteButton cliente={cliente} clientes={todosClientes} />
          </div>
          <p className="mt-1 text-sm text-foreground/60">
            {cliente.contato ?? "Sem contato cadastrado"}
            {cliente.origem ? ` · ${cliente.origem}` : ""}
            {cliente.email ? ` · ${cliente.email}` : ""}
          </p>
          {(cliente.cpf || cliente.dataNascimento || cliente.dataPrimeiroProcedimento) && (
            <p className="mt-1 text-sm text-foreground/60">
              {cliente.cpf ? `CPF ${cliente.cpf}` : ""}
              {cliente.dataNascimento
                ? `${cliente.cpf ? " · " : ""}Nascimento ${formatarData(cliente.dataNascimento)}`
                : ""}
              {cliente.dataPrimeiroProcedimento
                ? `${cliente.cpf || cliente.dataNascimento ? " · " : ""}1º procedimento ${formatarData(cliente.dataPrimeiroProcedimento)}`
                : ""}
            </p>
          )}
          {cliente.indicadoPor && (
            <p className="mt-1 text-sm text-foreground/60">
              Indicado por{" "}
              <Link
                href={`/clientes/${cliente.indicadoPor.id}`}
                className="font-medium text-primary hover:text-primary-dark hover:underline"
              >
                {cliente.indicadoPor.nome}
              </Link>
            </p>
          )}
        </div>
        <NovaVendaClienteButton clienteId={cliente.id} produtos={produtos} />
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Valor total gasto
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(valorTotalGasto)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Indicados por {cliente.nome.split(" ")[0]}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {cliente.indicados.length}
          </p>
        </div>
      </div>

      {cliente.observacoes && (
        <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Observações
          </p>
          <p className="mt-2 text-sm text-foreground/80">{cliente.observacoes}</p>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Histórico de vendas
        </h2>
        <HistoricoVendasTable vendas={cliente.entradasSaida} />
      </div>
    </main>
  );
}
