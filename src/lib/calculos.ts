export type ProdutoComPerfil = {
  precoVenda: number;
  custoMedioMaterial: number;
  perfilTributario: { aliquota: number };
};

export function calcularMargemContribuicao(produto: ProdutoComPerfil) {
  const impostos = (produto.precoVenda * produto.perfilTributario.aliquota) / 100;
  const margemReais = produto.precoVenda - produto.custoMedioMaterial - impostos;
  const margemPercentual =
    produto.precoVenda === 0 ? 0 : (margemReais / produto.precoVenda) * 100;

  return { margemReais, margemPercentual, impostos };
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
