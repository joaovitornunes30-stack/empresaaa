import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarMoeda } from "@/lib/financeiro";
import { calcularValorSessaoItem } from "@/lib/planos";
import { NovoPlanoModeloButton } from "@/components/clientes/novo-plano-modelo-button";
import { exigirSessaoPagina } from "@/lib/auth";
import { runWithTenant } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function PlanosModelosPage() {
  const sessao = await exigirSessaoPagina(["dono", "equipe", "consultor"]);
  return runWithTenant(sessao, () => PlanosModelosPageConteudo(sessao.papel === "consultor"));
}

async function PlanosModelosPageConteudo(somenteLeitura: boolean) {
  const [modelos, produtos] = await Promise.all([
    prisma.planoModelo.findMany({
      orderBy: { nome: "asc" },
      include: { itens: { include: { produto: { select: { nome: true } } } } },
    }),
    prisma.produto.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <Link
        href="/clientes/planos"
        className="mb-4 inline-block text-sm font-medium text-foreground/60 hover:text-primary-dark"
      >
        &larr; Voltar para Planos
      </Link>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Modelos de Plano</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Moldes reutilizáveis: cadastre uma vez e pré-preencha novos planos a partir deles.
          </p>
        </div>
        {!somenteLeitura && <NovoPlanoModeloButton produtos={produtos} />}
      </header>

      {modelos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-foreground/60">
            Nenhum modelo cadastrado ainda. Clique em &quot;Novo Modelo&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {modelos.map((modelo) => {
            const valorTotal = modelo.itens.reduce((total, item) => total + item.valorItem, 0);
            return (
              <div key={modelo.id} className="rounded-2xl border border-border bg-surface p-5">
                <p className="font-display text-base font-semibold text-foreground">
                  {modelo.nome}
                </p>
                <p className="mb-3 text-sm text-foreground/60">
                  Total {formatarMoeda(valorTotal)}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {modelo.itens.map((item) => (
                    <li key={item.id} className="text-sm text-foreground/70">
                      {item.produto.nome} &middot; {item.quantidadeSessoes}x{" "}
                      {formatarMoeda(calcularValorSessaoItem(item))} &middot; a cada{" "}
                      {item.intervaloDias} dias &middot; total {formatarMoeda(item.valorItem)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
