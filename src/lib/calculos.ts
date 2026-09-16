export type ComissaoTipo = "percentual" | "fixo";

export type ProdutoComPerfil = {
  precoVenda: number;
  custoMedioMaterial: number;
  comissaoTipo: ComissaoTipo;
  comissaoValor: number;
  perfilTributario: { aliquota: number };
};

export function calcularComissao(produto: ProdutoComPerfil) {
  return produto.comissaoTipo === "fixo"
    ? produto.comissaoValor
    : (produto.precoVenda * produto.comissaoValor) / 100;
}

export function calcularMargemContribuicao(produto: ProdutoComPerfil) {
  const impostos = (produto.precoVenda * produto.perfilTributario.aliquota) / 100;
  const comissao = calcularComissao(produto);
  const margemReais =
    produto.precoVenda - produto.custoMedioMaterial - impostos - comissao;
  const margemPercentual =
    produto.precoVenda === 0 ? 0 : (margemReais / produto.precoVenda) * 100;

  return { margemReais, margemPercentual, impostos, comissao };
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
