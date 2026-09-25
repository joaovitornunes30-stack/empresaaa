import { prisma } from "@/lib/prisma";
import { formatarMoeda, mesAtual } from "@/lib/financeiro";
import {
  calcularTotalRetiradoNoMes,
  calcularTotalRetiradoUltimos3Meses,
} from "@/lib/retiradas";
import { RetiradasTable } from "@/components/retiradas/retiradas-table";
import { NovaRetiradaButton } from "@/components/retiradas/nova-retirada-button";
import { exigirSessaoAba } from "@/lib/permissoes";
import { runWithTenant } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function RetiradasPage() {
  const sessao = await exigirSessaoAba("retiradas");
  return runWithTenant(sessao, () => RetiradasPageConteudo(sessao.papel === "consultor"));
}

async function RetiradasPageConteudo(somenteLeitura: boolean) {
  const retiradas = await prisma.retirada.findMany({
    orderBy: { data: "desc" },
  });

  const totalMes = calcularTotalRetiradoNoMes(retiradas, mesAtual());
  const totalUltimos3Meses = calcularTotalRetiradoUltimos3Meses(retiradas);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Retiradas</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Registro simples de retiradas — sem regras de limite por enquanto.
          </p>
        </div>
        {!somenteLeitura && <NovaRetiradaButton />}
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Total retirado no mês
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(totalMes)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Total retirado nos últimos 3 meses
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {formatarMoeda(totalUltimos3Meses)}
          </p>
        </div>
      </div>

      <RetiradasTable retiradas={retiradas} />
    </main>
  );
}
