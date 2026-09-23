export type ComissaoTipo = "percentual" | "fixo";

export type ProdutoComPerfil = {
  /** Valor cobrado por hora de procedimento (R$/h). */
  precoVenda: number;
  custoMedioMaterial: number;
  duracaoMinutos: number;
  comissaoTipo: ComissaoTipo;
  comissaoValor: number;
  perfilTributario: { aliquota: number };
};

/** Preço total do procedimento: valor por hora x duração. */
export function calcularPrecoTotal(
  produto: Pick<ProdutoComPerfil, "precoVenda" | "duracaoMinutos">,
) {
  return produto.precoVenda * (produto.duracaoMinutos / 60);
}

export function calcularComissao(produto: ProdutoComPerfil) {
  const precoTotal = calcularPrecoTotal(produto);
  return produto.comissaoTipo === "fixo"
    ? produto.comissaoValor
    : (precoTotal * produto.comissaoValor) / 100;
}

export type ProdutoParaCusto = Pick<
  ProdutoComPerfil,
  "custoMedioMaterial" | "comissaoTipo" | "comissaoValor" | "perfilTributario"
>;

/**
 * Custo total (material + imposto + comissão) para um valor de venda
 * qualquer — não necessariamente o preço de catálogo do produto. Usado
 * para o custo por sessão de um Plano, onde a base é o valor da sessão
 * (valorTotal do plano / numeroSessoes), não o precoVenda do produto.
 */
export function calcularCustoComBase(produto: ProdutoParaCusto, valorBase: number) {
  const impostos = (valorBase * produto.perfilTributario.aliquota) / 100;
  const comissao =
    produto.comissaoTipo === "fixo"
      ? produto.comissaoValor
      : (valorBase * produto.comissaoValor) / 100;
  return produto.custoMedioMaterial + impostos + comissao;
}

export function calcularMargemContribuicao(produto: ProdutoComPerfil) {
  const precoTotal = calcularPrecoTotal(produto);
  const impostos = (precoTotal * produto.perfilTributario.aliquota) / 100;
  const comissao = calcularComissao(produto);
  const margemReais = precoTotal - produto.custoMedioMaterial - impostos - comissao;
  const margemPercentual =
    precoTotal === 0 ? 0 : (margemReais / precoTotal) * 100;

  return { margemReais, margemPercentual, impostos, comissao, precoTotal };
}

export const MARGEM_ALERTA_PERCENTUAL = 30;

export function nivelMargem(margemPercentual: number): "boa" | "baixa" {
  return margemPercentual >= MARGEM_ALERTA_PERCENTUAL ? "boa" : "baixa";
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarPercentual(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatarDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`;
}
