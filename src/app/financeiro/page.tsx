import { prisma } from "@/lib/prisma";
import {
  agruparDividasPorPrazo,
  calcularProjecaoCaixa,
  calcularSaldoAtual,
  limitesDoMes,
  mesAtual,
} from "@/lib/financeiro";
import { ResumoDividas } from "@/components/financeiro/resumo-dividas";
import { ProjecaoCaixa } from "@/components/financeiro/projecao-caixa";
import { EntradasSaidasTable } from "@/components/financeiro/entradas-saidas-table";
import { NovaEntradaSaidaButton } from "@/components/financeiro/nova-entrada-saida-button";
import { DividasManager } from "@/components/financeiro/dividas-manager";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage(props: PageProps<"/financeiro">) {
  const searchParams = await props.searchParams;
  const mesParam = searchParams.mes;
  const mes = typeof mesParam === "string" && mesParam ? mesParam : mesAtual();
  const { inicio, fim } = limitesDoMes(mes);

  const [dividas, todasEntradasSaidas, parcelasPendentes, entradasSaidasDoMes] =
    await Promise.all([
      prisma.divida.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.entradaSaida.findMany({ select: { tipo: true, valor: true } }),
      prisma.parcela.findMany({
        where: { status: "pendente" },
        include: { entradaSaida: { select: { tipo: true } } },
      }),
      prisma.entradaSaida.findMany({
        where: { data: { gte: inicio, lt: fim } },
        include: { parcelas: true },
        orderBy: { data: "desc" },
      }),
    ]);

  const totaisPorPrazo = agruparDividasPorPrazo(dividas);
  const saldoAtual = calcularSaldoAtual(todasEntradasSaidas);
  const projecoes = calcularProjecaoCaixa(parcelasPendentes, saldoAtual);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Financeiro
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Acompanhe entradas, saídas, dívidas e a projeção de caixa da
            clínica.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DividasManager dividas={dividas} />
          <NovaEntradaSaidaButton />
        </div>
      </header>

      <div className="mb-8">
        <EntradasSaidasTable itens={entradasSaidasDoMes} mes={mes} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Projeção de caixa
        </h2>
        <ProjecaoCaixa saldoAtual={saldoAtual} projecoes={projecoes} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Dívidas por prazo
        </h2>
        <ResumoDividas totais={totaisPorPrazo} />
      </div>
    </main>
  );
}
