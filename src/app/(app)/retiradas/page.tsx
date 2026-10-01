import { prisma } from "@/lib/prisma";
import { formatarMoeda, mesAtual, limitesDoMes } from "@/lib/financeiro";
import {
  calcularTotalRetiradoNoMes,
  calcularTotalRetiradoUltimos3Meses,
  marcarRetiradasAcimaDoRecomendado,
} from "@/lib/retiradas";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";
import { RetiradasTable } from "@/components/retiradas/retiradas-table";
import { NovaRetiradaButton } from "@/components/retiradas/nova-retirada-button";
import { RetiradaSaudavelCard } from "@/components/retiradas/retirada-saudavel-card";
import { exigirSessaoAba } from "@/lib/permissoes";
import { runWithTenant } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function RetiradasPage() {
  const sessao = await exigirSessaoAba("retiradas");
  return runWithTenant(sessao, () =>
    RetiradasPageConteudo(sessao.clinicaId, sessao.papel === "consultor", sessao.papel !== "membro"),
  );
}

async function RetiradasPageConteudo(
  clinicaId: string,
  somenteLeituraRetiradas: boolean,
  podeAjustarConfig: boolean,
) {
  const hoje = new Date();
  const mes = mesAtual(hoje);

  const [retiradas, clinica] = await Promise.all([
    prisma.retirada.findMany({ orderBy: { data: "desc" } }),
    prisma.clinica.findUniqueOrThrow({ where: { id: clinicaId } }),
  ]);

  const estado = await calcularRetiradaSaudavel(
    clinica.percentualReservaRetirada,
    clinica.proLaboreCombinado,
    hoje,
  );

  const totalMes = calcularTotalRetiradoNoMes(retiradas, mes);
  const totalUltimos3Meses = calcularTotalRetiradoUltimos3Meses(retiradas);

  const { inicio, fim } = limitesDoMes(mes);
  const retiradasDoMes = retiradas.filter(
    (r) => r.data.getTime() >= inicio.getTime() && r.data.getTime() < fim.getTime(),
  );
  const destacadas =
    estado.estado === "sem_historico_sem_prolabore"
      ? new Set<string>()
      : marcarRetiradasAcimaDoRecomendado(retiradasDoMes, estado.retiradaSaudavel);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Retiradas</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Acompanhe suas retiradas e uma referência de quanto é saudável tirar da clínica.
          </p>
        </div>
        {!somenteLeituraRetiradas && <NovaRetiradaButton />}
      </header>

      <RetiradaSaudavelCard
        estado={estado}
        totalRetiradoMes={totalMes}
        percentualAtual={clinica.percentualReservaRetirada}
        proLaboreAtual={clinica.proLaboreCombinado}
        podeAjustar={podeAjustarConfig}
      />

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

      <RetiradasTable retiradas={retiradas} destacadas={destacadas} />
    </main>
  );
}
