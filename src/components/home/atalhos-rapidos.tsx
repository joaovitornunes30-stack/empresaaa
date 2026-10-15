import { NovaEntradaSaidaButton } from "@/components/financeiro/nova-entrada-saida-button";
import { NovoClienteButton } from "@/components/clientes/novo-cliente-button";
import { NovaRetiradaButton } from "@/components/retiradas/nova-retirada-button";
import { RegistrarMovimentoEstoqueButton } from "@/components/analise/registrar-movimento-estoque-button";

export function AtalhosRapidos({
  podeFinanceiro,
  podeClientes,
  podeRetiradas,
  podeMovimentoEstoque,
  produtos,
  clientes,
  donos,
  donoAtualId,
}: {
  podeFinanceiro: boolean;
  podeClientes: boolean;
  podeRetiradas: boolean;
  podeMovimentoEstoque: boolean;
  produtos: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
  donos: { id: string; nome: string }[];
  donoAtualId: string | null;
}) {
  if (!podeFinanceiro && !podeClientes && !podeRetiradas && !podeMovimentoEstoque) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-base font-semibold text-foreground">Atalhos rápidos</h2>
      <div className="flex flex-wrap gap-3">
        {podeFinanceiro && <NovaEntradaSaidaButton produtos={produtos} />}
        {podeClientes && <NovoClienteButton clientes={clientes} />}
        {podeRetiradas && <NovaRetiradaButton donos={donos} donoAtualId={donoAtualId} />}
        {podeMovimentoEstoque && <RegistrarMovimentoEstoqueButton produtos={produtos} />}
      </div>
    </section>
  );
}
