import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  calcularStatusCliente,
  calcularUltimaVenda,
  calcularValorTotalGasto,
  identificarClientesDistantes,
  obterProximoRetornoAtivo,
  rankearIndicacoes,
} from "@/lib/clientes";
import { ClientesTable } from "@/components/clientes/clientes-table";
import { NovoClienteButton } from "@/components/clientes/novo-cliente-button";
import { PacientesDistantes } from "@/components/clientes/pacientes-distantes";
import { RankingIndicacoes } from "@/components/clientes/ranking-indicacoes";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, produtos, modelos] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      include: {
        entradasSaida: { select: { valor: true, data: true, dataProximoRetorno: true } },
        _count: { select: { indicados: true } },
      },
    }),
    prisma.produto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.planoModelo.findMany({
      orderBy: { nome: "asc" },
      include: { itens: { select: { produtoId: true, quantidadeSessoes: true, valorItem: true, intervaloDias: true } } },
    }),
  ]);

  const linhasTabela = clientes.map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome,
    contato: cliente.contato,
    origem: cliente.origem,
    ultimaVenda: calcularUltimaVenda(cliente.entradasSaida),
    valorTotalGasto: calcularValorTotalGasto(cliente.entradasSaida),
    status: calcularStatusCliente(cliente.entradasSaida),
    proximoRetornoAtivo: obterProximoRetornoAtivo(cliente.entradasSaida),
  }));

  const distantes = identificarClientesDistantes(
    clientes.map((cliente) => ({
      id: cliente.id,
      nome: cliente.nome,
      observacoes: cliente.observacoes,
      entradasSaida: cliente.entradasSaida,
    })),
  );

  const ranking = rankearIndicacoes(
    clientes.map((cliente) => ({
      id: cliente.id,
      nome: cliente.nome,
      totalIndicados: cliente._count.indicados,
    })),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Acompanhe sua base, indicações e quem precisa de um retorno.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/clientes/planos"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground/70 hover:border-primary hover:text-primary-dark"
          >
            Planos
          </Link>
          <NovoClienteButton clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} />
        </div>
      </header>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Pacientes Distantes
        </h2>
        <PacientesDistantes clientes={distantes} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Todos os clientes
        </h2>
        <ClientesTable clientes={linhasTabela} produtos={produtos} modelos={modelos} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Indicações
        </h2>
        <RankingIndicacoes ranking={ranking} />
      </div>
    </main>
  );
}
