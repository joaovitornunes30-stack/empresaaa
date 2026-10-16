import { calcularCustoComAliquota, type ProdutoParaCustoComAliquota } from "@/lib/calculos";

export type ProdutoParaSaidaEmNumeros = {
  nome: string;
  margemReais: number;
  precoTotal: number;
};

export type PlanoEquivalente = { nome: string; quantidadeSessoes: number };

export type SaidaEmNumerosResultado =
  | { tipo: "sem_produto_com_margem" }
  | {
      tipo: "calculado";
      faltaPorMes: number;
      resultadoExtraNecessario: number;
      quantidadeNecessaria: number;
      produtoNome: string;
      margemUnitaria: number;
      faturamentoExtra: number;
      planoEquivalente: PlanoEquivalente | null;
    };

/**
 * Falta -> resultado extra necessário (dividindo pela reserva, já que uma
 * parte da sobra fica retida) -> quantidade do produto de maior margem
 * unitária para cobrir esse resultado (arredondada pra cima — nunca
 * "quase o suficiente") -> faturamento extra correspondente.
 */
export function calcularSaidaEmNumeros(
  faltaPorMes: number,
  percentualReservaRetirada: number,
  produtos: ProdutoParaSaidaEmNumeros[],
): SaidaEmNumerosResultado {
  const candidatos = produtos.filter((produto) => produto.margemReais > 0);
  if (candidatos.length === 0) return { tipo: "sem_produto_com_margem" };

  const melhor = candidatos.reduce((a, b) => (b.margemReais > a.margemReais ? b : a));
  const fatorReserva = 1 - percentualReservaRetirada / 100;
  const resultadoExtraNecessario = fatorReserva > 0 ? faltaPorMes / fatorReserva : faltaPorMes;
  const quantidadeNecessaria = Math.ceil(resultadoExtraNecessario / melhor.margemReais);
  const faturamentoExtra = quantidadeNecessaria * melhor.precoTotal;

  return {
    tipo: "calculado",
    faltaPorMes,
    resultadoExtraNecessario,
    quantidadeNecessaria,
    produtoNome: melhor.nome,
    margemUnitaria: melhor.margemReais,
    faturamentoExtra,
    planoEquivalente: null,
  };
}

export type ItemPlanoModeloParaMargem = {
  valorItem: number;
  produto: ProdutoParaCustoComAliquota & { perfilTributario: { aliquota: number } };
};

export type PlanoModeloParaMargem = { nome: string; itens: ItemPlanoModeloParaMargem[] };

/**
 * Entre todos os itens de todos os modelos de plano, o de maior margem por
 * sessão — "a conta equivalente em planos", mostrada junto da de produtos
 * avulsos quando a clínica tem modelos cadastrados.
 */
export function calcularMelhorPlanoEquivalente(
  resultadoExtraNecessario: number,
  planoModelos: PlanoModeloParaMargem[],
): PlanoEquivalente | null {
  let melhor: { nome: string; margemPorSessao: number } | null = null;

  for (const modelo of planoModelos) {
    for (const item of modelo.itens) {
      const custo = calcularCustoComAliquota(item.produto, item.valorItem, item.produto.perfilTributario.aliquota);
      const margemPorSessao = item.valorItem - custo;
      if (margemPorSessao > 0 && (!melhor || margemPorSessao > melhor.margemPorSessao)) {
        melhor = { nome: modelo.nome, margemPorSessao };
      }
    }
  }

  if (!melhor) return null;
  return {
    nome: melhor.nome,
    quantidadeSessoes: Math.ceil(resultadoExtraNecessario / melhor.margemPorSessao),
  };
}
