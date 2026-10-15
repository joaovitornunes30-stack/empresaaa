import { prisma } from "@/lib/prisma";
import type { PassoChecklist } from "@/lib/checklist";

/**
 * Cada passo é inferido de dados já existentes — nunca duplica nenhum
 * contador novo — exceto "abrir_margem_produto", que é uma interação
 * pontual de tela sem dado nenhum por trás (vem de Clinica.abriuMargemProduto,
 * passado pelo chamador). "custo_de_vida" é por usuário (cada dono só marca
 * o próprio preenchimento).
 */
export async function calcularPassosConcluidos(
  usuarioId: string,
  abriuMargemProduto: boolean,
): Promise<Record<PassoChecklist, boolean>> {
  const [
    perfis,
    produtos,
    entradas,
    saidas,
    despesas,
    dividas,
    metas,
    retiradas,
    custoDeVida,
    clientes,
    estoqueMovimentos,
  ] = await Promise.all([
    prisma.perfilTributario.count(),
    prisma.produto.count(),
    prisma.entradaSaida.count({ where: { tipo: "entrada" } }),
    prisma.entradaSaida.count({ where: { tipo: "saida" } }),
    prisma.despesaAdministrativa.count(),
    prisma.divida.count(),
    prisma.metaDoMes.count(),
    prisma.retirada.count(),
    prisma.custoDeVida.count({ where: { usuarioId } }),
    prisma.cliente.count(),
    prisma.estoqueMovimento.count(),
  ]);

  return {
    perfil_tributario: perfis > 0,
    primeiro_produto: produtos > 0,
    abrir_margem_produto: abriuMargemProduto,
    primeira_entrada: entradas > 0,
    primeira_saida: saidas > 0,
    despesa_ou_divida: despesas > 0 || dividas > 0,
    meta_do_mes: metas > 0,
    primeira_retirada: retiradas > 0,
    custo_de_vida: custoDeVida > 0,
    primeiro_cliente: clientes > 0,
    primeiro_movimento_estoque: estoqueMovimentos > 0,
  };
}
