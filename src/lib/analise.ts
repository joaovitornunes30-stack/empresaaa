import { formatarMoeda, limitesDoMes } from "@/lib/financeiro";
import { calcularCustoComAliquota, type ProdutoParaCustoComAliquota } from "@/lib/calculos";

/** Faixa saudável de gasto com mídia, em % do faturamento do mês. Apenas
 * uma referência exibida na tela — não é um limite gravado no banco. */
export const FAIXA_SAUDAVEL_MIDIA = { min: 0.04, max: 0.06 };

/** Últimos `quantidade` meses no formato "YYYY-MM", terminando no mês de `hoje`. */
export function ultimosMeses(quantidade: number, hoje: Date = new Date()) {
  const meses: string[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`);
  }
  return meses;
}

export function diasRestantesNoMes(hoje: Date = new Date()) {
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  return ultimoDia - hoje.getDate() + 1;
}

export function diasNoMes(hoje: Date = new Date()) {
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
}

/** Faturamento do mês = soma das Entradas (tipo "entrada") registradas no mês. */
export function calcularFaturamentoMes(entradasSaidas: { tipo: string; valor: number }[]) {
  return entradasSaidas
    .filter((item) => item.tipo === "entrada")
    .reduce((total, item) => total + item.valor, 0);
}

/** Soma apenas das Entradas de categoria "Vendas" no mês — usada para a
 * Meta do Mês, mais estreita que o Faturamento (que inclui qualquer
 * categoria de entrada). */
export function calcularVendasMes(
  entradasSaidas: { tipo: string; categoria: string; valor: number }[],
) {
  return entradasSaidas
    .filter((item) => item.tipo === "entrada" && /^vendas?$/i.test(item.categoria.trim()))
    .reduce((total, item) => total + item.valor, 0);
}

/** Caixa do mês = soma das parcelas de vendas com status "pago" cuja
 * dataVencimento cai no mês atual (inclui parcelas de vendas de meses
 * anteriores que foram pagas agora). */
export function calcularCaixaMes(parcelasPagasDeVendas: { valor: number }[]) {
  return parcelasPagasDeVendas.reduce((total, parcela) => total + parcela.valor, 0);
}

export function calcularMetaDoMes(
  faturamentoMes: number,
  valorMeta: number,
  hoje: Date = new Date(),
) {
  const percentual =
    valorMeta > 0 ? Math.max(0, Math.min(100, (faturamentoMes / valorMeta) * 100)) : 0;
  const faltante = Math.max(0, valorMeta - faturamentoMes);
  return {
    percentual,
    faltante,
    atingiu: valorMeta > 0 && faturamentoMes >= valorMeta,
    diasRestantes: diasRestantesNoMes(hoje),
    diasNoMes: diasNoMes(hoje),
  };
}

export type MovimentoEstoque = { tipo: string; quantidade: number; data: Date };

/** Quantidade atual em estoque = soma(entrada) - soma(saida). */
export function calcularEstoqueAtual(movimentos: MovimentoEstoque[]) {
  return movimentos.reduce(
    (total, m) => total + (m.tipo === "entrada" ? m.quantidade : -m.quantidade),
    0,
  );
}

/** Quantidade em estoque ao final de cada um dos meses informados (saldo
 * acumulado de todos os movimentos até o fim daquele mês). */
export function calcularHistoricoEstoque(movimentos: MovimentoEstoque[], meses: string[]) {
  return meses.map((mes) => {
    const { fim } = limitesDoMes(mes);
    const quantidade = movimentos
      .filter((m) => m.data.getTime() < fim.getTime())
      .reduce((total, m) => total + (m.tipo === "entrada" ? m.quantidade : -m.quantidade), 0);
    return { mes, quantidade };
  });
}

export type EntradaComProduto = { tipo: string; valor: number; produtoId: string | null };

export type FatiaComposicao = {
  produtoId: string | null;
  nome: string;
  valor: number;
  percentual: number;
};

/** Faturamento do mês agrupado por produto (via EntradaSaida.produtoId).
 * Entradas sem produto associado entram em "Outros / sem produto". */
export function calcularComposicaoFaturamento(
  entradasDoMes: EntradaComProduto[],
  produtos: { id: string; nome: string }[],
): FatiaComposicao[] {
  const vendas = entradasDoMes.filter((item) => item.tipo === "entrada");
  const total = vendas.reduce((soma, item) => soma + item.valor, 0);

  const porChave = new Map<string, number>();
  for (const item of vendas) {
    const chave = item.produtoId ?? "outros";
    porChave.set(chave, (porChave.get(chave) ?? 0) + item.valor);
  }

  const nomePorId = new Map(produtos.map((produto) => [produto.id, produto.nome]));

  return Array.from(porChave.entries())
    .map(([chave, valor]) => ({
      produtoId: chave === "outros" ? null : chave,
      nome: chave === "outros" ? "Outros / sem produto" : (nomePorId.get(chave) ?? "Produto removido"),
      valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);
}

/** Soma de Saídas com categoria "Mídia" no mês. */
export function calcularGastoMidia(saidasDoMes: { categoria: string; valor: number }[]) {
  return saidasDoMes
    .filter((item) => item.categoria === "Mídia")
    .reduce((total, item) => total + item.valor, 0);
}

export type MovimentoComparativo = { tipo: string; valor: number; data: Date };

export type PontoComparativo = { mes: string; faturamento: number; despesas: number };

/** Faturamento e despesas por mês, para os meses informados. */
export function calcularComparativoMensal(
  entradasSaidas: MovimentoComparativo[],
  meses: string[],
): PontoComparativo[] {
  return meses.map((mes) => {
    const { inicio, fim } = limitesDoMes(mes);
    const doMes = entradasSaidas.filter(
      (item) => item.data.getTime() >= inicio.getTime() && item.data.getTime() < fim.getTime(),
    );
    return {
      mes,
      faturamento: doMes
        .filter((item) => item.tipo === "entrada")
        .reduce((total, item) => total + item.valor, 0),
      despesas: doMes
        .filter((item) => item.tipo === "saida")
        .reduce((total, item) => total + item.valor, 0),
    };
  });
}

export function formatarMesLabel(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const data = new Date(ano, mesNum - 1, 1);
  return data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

type ResumoDoMesInput = {
  faturamentoMes: number;
  faturamentoMesAnterior: number;
  caixaMes: number;
  dividaCurtoPrazo: number;
  gastoMidia: number;
  estoques: { nome: string; historico: { mes: string; quantidade: number }[] }[];
  meta: { valorMeta: number; percentual: number; diasRestantes: number; diasNoMes: number } | null;
};

/** Resumo do mês por regras condicionais diretas, cruzando os indicadores
 * já calculados. Sem IA — apenas leitura dos números reais. */
export function gerarResumoDoMes(input: ResumoDoMesInput): string[] {
  const linhas: string[] = [];

  if (input.faturamentoMesAnterior > 0) {
    const variacao =
      ((input.faturamentoMes - input.faturamentoMesAnterior) / input.faturamentoMesAnterior) * 100;
    if (Math.abs(variacao) < 5) {
      linhas.push(
        `Faturamento estável em relação ao mês passado (${formatarMoeda(input.faturamentoMes)}).`,
      );
    } else if (variacao > 0) {
      linhas.push(`Faturamento subiu ${variacao.toFixed(0)}% em relação ao mês passado.`);
    } else {
      linhas.push(`Faturamento caiu ${Math.abs(variacao).toFixed(0)}% em relação ao mês passado.`);
    }
  }

  if (input.dividaCurtoPrazo > 0) {
    if (input.dividaCurtoPrazo > input.caixaMes) {
      linhas.push(
        `Dívidas de curto prazo (${formatarMoeda(input.dividaCurtoPrazo)}) superam o caixa recebido no mês — atenção à liquidez.`,
      );
    } else {
      linhas.push(
        `Dívidas de curto prazo somam ${formatarMoeda(input.dividaCurtoPrazo)}, dentro da capacidade do caixa do mês.`,
      );
    }
  }

  for (const produto of input.estoques) {
    const primeiro = produto.historico[0];
    const ultimo = produto.historico[produto.historico.length - 1];
    if (primeiro && ultimo && primeiro.quantidade > 0) {
      const variacao = ((ultimo.quantidade - primeiro.quantidade) / primeiro.quantidade) * 100;
      if (variacao <= -20) {
        linhas.push(
          `Estoque de ${produto.nome} caiu ${Math.abs(variacao).toFixed(0)}% nos últimos 3 meses.`,
        );
      }
    }
  }

  if (input.faturamentoMes > 0) {
    const percentualMidia = (input.gastoMidia / input.faturamentoMes) * 100;
    const faixaMin = FAIXA_SAUDAVEL_MIDIA.min * 100;
    const faixaMax = FAIXA_SAUDAVEL_MIDIA.max * 100;
    if (percentualMidia > faixaMax) {
      linhas.push(
        `Gasto com mídia (${percentualMidia.toFixed(1)}% do faturamento) está acima da faixa saudável de ${faixaMin}–${faixaMax}%.`,
      );
    } else if (percentualMidia < faixaMin && input.gastoMidia > 0) {
      linhas.push(
        `Gasto com mídia (${percentualMidia.toFixed(1)}% do faturamento) está abaixo da faixa saudável de ${faixaMin}–${faixaMax}%.`,
      );
    } else if (input.gastoMidia > 0) {
      linhas.push(
        `Gasto com mídia (${percentualMidia.toFixed(1)}% do faturamento) está dentro da faixa saudável de ${faixaMin}–${faixaMax}%.`,
      );
    }
  }

  if (input.meta && input.meta.valorMeta > 0) {
    const diasPassados = input.meta.diasNoMes - input.meta.diasRestantes;
    const ritmoEsperado =
      input.meta.diasNoMes > 0 ? (diasPassados / input.meta.diasNoMes) * 100 : 0;
    if (input.meta.percentual >= 100) {
      linhas.push("Meta de faturamento do mês já foi batida.");
    } else if (input.meta.percentual < ritmoEsperado - 10) {
      linhas.push(
        `Meta do mês em ritmo abaixo do esperado: ${input.meta.percentual.toFixed(0)}% atingido, com ${input.meta.diasRestantes} dias restantes.`,
      );
    }
  }

  if (linhas.length === 0) {
    linhas.push("Ainda não há dados suficientes no mês para gerar um resumo.");
  }

  return linhas;
}

// ---------- "Para Onde Vai o Dinheiro" ----------

export type ProdutoParaCustoVenda = ProdutoParaCustoComAliquota & {
  id: string;
  nome: string;
  perfilTributario: { aliquota: number };
};

/**
 * Uma "venda simples" é uma Entrada com produto vinculado — diferente de uma
 * venda de Plano, que não grava produtoId na EntradaSaida (o valor total do
 * plano entra de uma vez, e sua receita é reconhecida à parte, por sessão
 * entregue — ver calcularReceitaReconhecidaMes/calcularCustoMes em
 * lib/planos.ts). Sem esse filtro por produtoId, a receita/custo de um plano
 * contaria duas vezes nesta seção.
 */
export type VendaSimplesComProduto = { valor: number; produto: ProdutoParaCustoVenda | null };

export function filtrarVendasSimplesDoMes(entradasSaidas: {
  tipo: string;
  produto: ProdutoParaCustoVenda | null;
  valor: number;
}[]): VendaSimplesComProduto[] {
  return entradasSaidas.filter(
    (item): item is typeof item & { produto: ProdutoParaCustoVenda } =>
      item.tipo === "entrada" && item.produto !== null,
  );
}

export function calcularReceitaVendasSimplesMes(vendasSimples: { valor: number }[]) {
  return vendasSimples.reduce((total, venda) => total + venda.valor, 0);
}

/** Mesmo cálculo usado na margem de contribuição do produto (material +
 * imposto + comissão), aplicado ao valor de cada venda simples do mês. */
export function calcularCustoVendasSimplesMes(vendasSimples: VendaSimplesComProduto[]) {
  return vendasSimples.reduce((total, venda) => {
    if (!venda.produto) return total;
    return total + calcularCustoComAliquota(venda.produto, venda.valor, venda.produto.perfilTributario.aliquota);
  }, 0);
}

export type CustoPorProduto = { produtoId: string; nome: string; custo: number };

export function calcularCustoPorProdutoDasVendasSimplesMes(
  vendasSimples: VendaSimplesComProduto[],
): CustoPorProduto[] {
  const porProduto = new Map<string, CustoPorProduto>();
  for (const venda of vendasSimples) {
    if (!venda.produto) continue;
    const custo = calcularCustoComAliquota(venda.produto, venda.valor, venda.produto.perfilTributario.aliquota);
    const atual = porProduto.get(venda.produto.id);
    if (atual) atual.custo += custo;
    else porProduto.set(venda.produto.id, { produtoId: venda.produto.id, nome: venda.produto.nome, custo });
  }
  return Array.from(porProduto.values());
}

/** Combina duas listas de custo por produto (vendas simples + sessões de
 * plano) somando o custo de produtos repetidos, ordenado do que mais
 * consumiu para o que menos consumiu. */
export function mesclarCustoPorProduto(...listas: CustoPorProduto[][]): CustoPorProduto[] {
  const porProduto = new Map<string, CustoPorProduto>();
  for (const lista of listas) {
    for (const item of lista) {
      const atual = porProduto.get(item.produtoId);
      if (atual) atual.custo += item.custo;
      else porProduto.set(item.produtoId, { ...item });
    }
  }
  return Array.from(porProduto.values()).sort((a, b) => b.custo - a.custo);
}

/** Saídas do mês que não são compra de Material (já contabilizada no custo
 * do que foi vendido) nem parcela de Dívida (linha própria na cascata) —
 * aluguel, mídia, salário, prestador de serviço, impostos avulsos, etc. */
export function calcularCustosFixosMes(
  entradasSaidas: { tipo: string; categoria: string; valor: number }[],
) {
  return entradasSaidas
    .filter(
      (item) => item.tipo === "saida" && item.categoria !== "Material" && item.categoria !== "Dívida",
    )
    .reduce((total, item) => total + item.valor, 0);
}

export function calcularParcelasDividaPagasMes(parcelasPagasDeDivida: { valor: number }[]) {
  return parcelasPagasDeDivida.reduce((total, parcela) => total + parcela.valor, 0);
}

export type ParaOndeVaiDinheiroInput = {
  receitaVendasSimplesMes: number;
  receitaReconhecidaMes: number;
  custoVendasSimplesMes: number;
  custoSessoesPlanosMes: number;
  custosFixosMes: number;
  parcelasDividaPagasMes: number;
};

export function calcularParaOndeVaiDinheiro(input: ParaOndeVaiDinheiroInput) {
  const receitaMes = input.receitaVendasSimplesMes + input.receitaReconhecidaMes;
  const custoVendidoMes = input.custoVendasSimplesMes + input.custoSessoesPlanosMes;
  const sobraDepoisDeProduzir = receitaMes - custoVendidoMes;
  const sobraFinalDoMes = sobraDepoisDeProduzir - input.custosFixosMes;
  const oQueRealmenteSobrou = sobraFinalDoMes - input.parcelasDividaPagasMes;

  return {
    receitaMes,
    custoVendidoMes,
    sobraDepoisDeProduzir,
    custosFixosMes: input.custosFixosMes,
    sobraFinalDoMes,
    parcelasDividaPagasMes: input.parcelasDividaPagasMes,
    oQueRealmenteSobrou,
  };
}
