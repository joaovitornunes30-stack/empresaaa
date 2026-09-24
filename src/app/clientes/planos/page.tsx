import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, mesAtual } from "@/lib/financeiro";
import { calcularCustoMes, calcularReceitaReconhecidaMes, type PlanoParaResumo } from "@/lib/planos";
import { PlanoCard } from "@/components/clientes/plano-card";
import { NovoPlanoButton } from "@/components/clientes/novo-plano-button";

export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const mes = mesAtual();

  const [planos, produtos, clientes, modelos] = await Promise.all([
    prisma.plano.findMany({
      orderBy: { dataVenda: "desc" },
      include: {
        cliente: { select: { nome: true } },
        itens: {
          include: {
            produto: {
              select: {
                nome: true,
                custoMedioMaterial: true,
                comissaoTipo: true,
                comissaoValor: true,
                perfilTributario: { select: { aliquota: true } },
              },
            },
            sessoes: { orderBy: { numero: "asc" } },
          },
        },
      },
    }),
    prisma.produto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.planoModelo.findMany({
      orderBy: { nome: "asc" },
      include: { itens: { select: { produtoId: true, quantidadeSessoes: true, valorItem: true, intervaloDias: true } } },
    }),
  ]);

  const planosParaResumo: PlanoParaResumo[] = planos.map((plano) => ({
    itens: plano.itens.map((item) => ({
      valorItem: item.valorItem,
      quantidadeSessoes: item.quantidadeSessoes,
      produto: item.produto,
      sessoes: item.sessoes,
    })),
  }));

  const receitaReconhecidaMes = calcularReceitaReconhecidaMes(planosParaResumo, mes);
  const custoMes = calcularCustoMes(planosParaResumo, mes);

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
          <h1 className="font-display text-2xl font-bold text-foreground">Planos</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Pacotes de sessões vendidos e o acompanhamento da entrega mês a mês.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/clientes/planos/modelos"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground/70 hover:border-primary hover:text-primary-dark"
          >
            Modelos de Plano
          </Link>
          <NovoPlanoButton produtos={produtos} modelos={modelos} clientes={clientes} />
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/50">
            Receita reconhecida no mês
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(receitaReconhecidaMes)}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Soma do valor por sessão de cada Sessao entregue neste mês —
            diferente do Caixa do mês, que reflete o dinheiro recebido.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/50">
            Custo no mês
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(custoMes)}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Material, imposto (alíquota conservadora do plano) e comissão
            das sessões entregues neste mês.
          </p>
        </div>
      </div>

      {planos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-foreground/60">
            Nenhum plano cadastrado ainda. Clique em &quot;Novo Plano&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {planos.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} />
          ))}
        </div>
      )}
    </main>
  );
}
