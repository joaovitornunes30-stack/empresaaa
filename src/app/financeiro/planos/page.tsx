import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, mesAtual } from "@/lib/financeiro";
import { calcularCustoMes, calcularReceitaReconhecidaMes, type SessaoComPlano } from "@/lib/planos";
import { PlanoCard } from "@/components/financeiro/plano-card";

export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const mes = mesAtual();

  const planos = await prisma.plano.findMany({
    orderBy: { dataVenda: "desc" },
    include: {
      cliente: { select: { nome: true } },
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
  });

  const sessoesComPlano: SessaoComPlano[] = planos.flatMap((plano) =>
    plano.sessoes.map((sessao) => ({
      status: sessao.status,
      dataEntregue: sessao.dataEntregue,
      plano: {
        valorTotal: plano.valorTotal,
        numeroSessoes: plano.numeroSessoes,
        produto: plano.produto,
      },
    })),
  );

  const receitaReconhecidaMes = calcularReceitaReconhecidaMes(sessoesComPlano, mes);
  const custoMes = calcularCustoMes(sessoesComPlano, mes);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <Link
        href="/financeiro"
        className="mb-4 inline-block text-sm font-medium text-foreground/60 hover:text-primary-dark"
      >
        &larr; Voltar para Financeiro
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Planos</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Pacotes de sessões vendidos e o acompanhamento da entrega mês a mês.
        </p>
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
            Material, imposto e comissão das sessões entregues neste mês.
          </p>
        </div>
      </div>

      {planos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-foreground/60">
            Nenhum plano cadastrado ainda. Crie uma venda com múltiplas
            sessões para começar.
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
