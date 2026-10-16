"use client";

import { Fragment, useState } from "react";
import {
  calcularMargemContribuicao,
  formatarDuracao,
  formatarMoeda,
  formatarPercentual,
  nivelMargem,
} from "@/lib/calculos";
import { marcarAbriuMargemProduto } from "@/app/(app)/home/actions";

function formatarDuracaoComValor(duracaoMinutos: number, precoVenda: number) {
  return `${formatarDuracao(duracaoMinutos)} · ${formatarMoeda(precoVenda)}/h`;
}

function formatarComissao(
  comissaoTipo: "percentual" | "fixo",
  comissaoValor: number,
  comissaoReais: number,
) {
  return comissaoTipo === "percentual"
    ? `${formatarPercentual(comissaoValor)} · ${formatarMoeda(comissaoReais)}`
    : `${formatarMoeda(comissaoValor)} (fixo)`;
}

type Produto = {
  id: string;
  nome: string;
  precoVenda: number;
  custoMedioMaterial: number;
  duracaoMinutos: number;
  comissaoTipo: "percentual" | "fixo";
  comissaoValor: number;
  perfilTributario: { nome: string; aliquota: number };
  protocoloItens: {
    quantidade: number;
    material: { nome: string; custoMedioMaterial: number };
  }[];
};

export function ProdutosTable({ produtos }: { produtos: Produto[] }) {
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  function alternarDetalhe(produtoId: string) {
    setExpandidoId((atual) => (atual === produtoId ? null : produtoId));
    marcarAbriuMargemProduto(new FormData()).catch(() => {});
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm text-foreground/60">
          Nenhum produto cadastrado ainda. Clique em &quot;Novo Produto&quot;
          para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
            <th className="px-5 py-3 font-medium">Produto</th>
            <th className="px-5 py-3 font-medium">Preço de venda</th>
            <th className="px-5 py-3 font-medium">Perfil tributário</th>
            <th className="px-5 py-3 font-medium">Duração</th>
            <th className="px-5 py-3 font-medium">Custo material</th>
            <th className="px-5 py-3 font-medium">Comissão</th>
            <th className="px-5 py-3 font-medium">Margem de contribuição</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => {
            const { margemReais, margemPercentual, precoTotal, comissao } =
              calcularMargemContribuicao(produto);
            const nivel = nivelMargem(margemPercentual);

            const impostos = (precoTotal * produto.perfilTributario.aliquota) / 100;
            const expandido = expandidoId === produto.id;

            return (
              <Fragment key={produto.id}>
              <tr className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-medium text-foreground">
                  <button
                    type="button"
                    onClick={() => alternarDetalhe(produto.id)}
                    className="text-left hover:text-primary-dark"
                    aria-expanded={expandido}
                  >
                    {produto.nome}
                    <span className="ml-1.5 text-xs text-foreground/40">{expandido ? "▲" : "▼"}</span>
                  </button>
                </td>
                <td className="px-5 py-4 font-medium text-foreground">
                  {formatarMoeda(precoTotal)}
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {produto.perfilTributario.nome} (
                  {produto.perfilTributario.aliquota}%)
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {formatarDuracaoComValor(
                    produto.duracaoMinutos,
                    produto.precoVenda,
                  )}
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {produto.protocoloItens.length > 0 ? (
                    <span
                      className="inline-flex cursor-help items-center gap-1.5"
                      title={produto.protocoloItens
                        .map(
                          (item) =>
                            `${item.material.nome}: ${formatarMoeda(item.material.custoMedioMaterial)} × ${item.quantidade} = ${formatarMoeda(item.material.custoMedioMaterial * item.quantidade)}`,
                        )
                        .join("\n")}
                    >
                      {formatarMoeda(produto.custoMedioMaterial)}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        calculado
                      </span>
                    </span>
                  ) : (
                    formatarMoeda(produto.custoMedioMaterial)
                  )}
                </td>
                <td className="px-5 py-4 text-foreground/70">
                  {formatarComissao(
                    produto.comissaoTipo,
                    produto.comissaoValor,
                    comissao,
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      nivel === "boa"
                        ? "bg-good-bg text-good"
                        : "bg-warn-bg text-warn"
                    }`}
                  >
                    {formatarPercentual(margemPercentual)} ·{" "}
                    {formatarMoeda(margemReais)}
                  </span>
                </td>
              </tr>
              {expandido && (
                <tr className="border-b border-border bg-background/50 last:border-0">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-foreground/70 sm:grid-cols-4">
                      <div>
                        <p className="text-foreground/50">Preço total</p>
                        <p className="font-semibold text-foreground">{formatarMoeda(precoTotal)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/50">Custo material</p>
                        <p className="font-semibold text-foreground">{formatarMoeda(produto.custoMedioMaterial)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/50">Impostos ({produto.perfilTributario.aliquota}%)</p>
                        <p className="font-semibold text-foreground">{formatarMoeda(impostos)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/50">Comissão</p>
                        <p className="font-semibold text-foreground">{formatarMoeda(comissao)}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-foreground/50">Margem de contribuição</p>
                        <p className="font-semibold text-foreground">
                          {formatarMoeda(margemReais)} ({formatarPercentual(margemPercentual)})
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
