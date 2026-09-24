import { prisma } from "@/lib/prisma";
import { ProdutosTable } from "@/components/produtos/produtos-table";
import { NovoProdutoButton } from "@/components/produtos/novo-produto-button";
import { PerfisTributariosManager } from "@/components/produtos/perfis-tributarios-manager";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const [produtos, perfis] = await Promise.all([
    prisma.produto.findMany({
      include: {
        perfilTributario: true,
        protocoloItens: {
          include: { material: { select: { nome: true, custoMedioMaterial: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.perfilTributario.findMany({ orderBy: { nome: "asc" } }),
  ]);

  // Só produtos que não são, eles mesmos, um protocolo podem ser usados como
  // material de um protocolo (evita protocolo aninhado).
  const materiaisDisponiveis = produtos
    .filter((produto) => produto.protocoloItens.length === 0)
    .map((produto) => ({ id: produto.id, nome: produto.nome, custoMedioMaterial: produto.custoMedioMaterial }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Cadastre seus produtos e serviços e acompanhe a margem de
            contribuição de cada um.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PerfisTributariosManager perfis={perfis} />
          <NovoProdutoButton perfis={perfis} materiaisDisponiveis={materiaisDisponiveis} />
        </div>
      </header>

      <ProdutosTable produtos={produtos} />
    </main>
  );
}
