"use client";

import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "@/lib/financeiro";
import { Modal } from "@/components/ui/modal";
import type { CustoPorProduto } from "@/lib/analise";

const DEFINICOES: Record<string, string> = {
  receita:
    "Tudo que você vendeu neste mês, incluindo sessões de planos que foram entregues agora, mesmo que o cliente já tenha pago antes.",
  custoVendido:
    "Material usado, imposto pago e comissão de profissional em cima do que foi vendido/entregue este mês.",
  sobraProduzir:
    "O que sobra depois de descontar o custo direto de cada venda — antes de pagar aluguel, salário e outras contas fixas.",
  custosFixos:
    "Aluguel, mídia, salário, prestadores de serviço e outras contas que você paga todo mês, independente de quanto vendeu.",
  sobraFinal: "O que sobra depois de pagar as contas fixas da clínica.",
  parcelasDivida:
    "Quanto saiu este mês pagando dívidas que você já tem (empréstimos, cartão parcelado, etc.).",
  sobrouDeVerdade:
    "O dinheiro que sobrou de verdade este mês, depois de tudo — isso pode virar retirada sua ou ser reinvestido na clínica.",
};

function DefinicaoBotao({
  chave,
  aberto,
  onToggle,
}: {
  chave: string;
  aberto: boolean;
  onToggle: (chave: string | null) => void;
}) {
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => onToggle(aberto ? null : chave)}
        aria-label="O que significa esta linha"
        aria-expanded={aberto}
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-foreground/30 text-[10px] font-semibold leading-none text-foreground/50 hover:border-primary hover:text-primary"
      >
        ?
      </button>
      {aberto && (
        <span className="absolute left-0 top-6 z-20 w-64 rounded-xl border border-border bg-surface p-3 text-xs font-normal normal-case leading-relaxed text-foreground/80 shadow-lg">
          {DEFINICOES[chave]}
        </span>
      )}
    </span>
  );
}

export function ParaOndeVaiDinheiro({
  receitaMes,
  custoVendidoMes,
  sobraDepoisDeProduzir,
  custosFixosMes,
  sobraFinalDoMes,
  parcelasDividaPagasMes,
  oQueRealmenteSobrou,
  custoPorProduto,
}: {
  receitaMes: number;
  custoVendidoMes: number;
  sobraDepoisDeProduzir: number;
  custosFixosMes: number;
  sobraFinalDoMes: number;
  parcelasDividaPagasMes: number;
  oQueRealmenteSobrou: number;
  custoPorProduto: CustoPorProduto[];
}) {
  const [definicaoAberta, setDefinicaoAberta] = useState<string | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!definicaoAberta) return;
    function aoClicarFora(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setDefinicaoAberta(null);
      }
    }
    document.addEventListener("click", aoClicarFora);
    return () => document.removeEventListener("click", aoClicarFora);
  }, [definicaoAberta]);

  const custoTotalDetalhado = custoPorProduto.reduce((total, item) => total + item.custo, 0);

  const linhas: {
    key: string;
    label: string;
    valor: number;
    definicao: string;
    subtotal?: boolean;
    destaque?: boolean;
    comDetalhes?: boolean;
  }[] = [
    { key: "receita", label: "Receita do mês", valor: receitaMes, definicao: "receita" },
    {
      key: "custoVendido",
      label: "(−) Quanto custou o que foi vendido",
      valor: custoVendidoMes,
      definicao: "custoVendido",
      comDetalhes: true,
    },
    {
      key: "sobraProduzir",
      label: "= Sobra depois de produzir",
      valor: sobraDepoisDeProduzir,
      definicao: "sobraProduzir",
      subtotal: true,
    },
    {
      key: "custosFixos",
      label: "(−) Custos fixos do mês",
      valor: custosFixosMes,
      definicao: "custosFixos",
    },
    {
      key: "sobraFinal",
      label: "= Sobra final do mês",
      valor: sobraFinalDoMes,
      definicao: "sobraFinal",
      subtotal: true,
    },
    {
      key: "parcelasDivida",
      label: "(−) Parcelas de dívida pagas no mês",
      valor: parcelasDividaPagasMes,
      definicao: "parcelasDivida",
    },
    {
      key: "sobrouDeVerdade",
      label: "= O que realmente sobrou",
      valor: oQueRealmenteSobrou,
      definicao: "sobrouDeVerdade",
      destaque: true,
    },
  ];

  return (
    <div ref={cardRef} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-1 font-display text-base font-semibold text-foreground">
        Para Onde Vai o Dinheiro
      </h2>
      <p className="mb-5 text-sm text-foreground/60">
        A sobra real do mês, etapa por etapa.
      </p>

      <div className="flex flex-col">
        {linhas.map((linha, index) => (
          <div
            key={linha.key}
            style={{ marginLeft: Math.min(index, 6) * 10 }}
            className={`flex items-baseline justify-between gap-3 border-l-2 py-2.5 pl-3 ${
              linha.destaque
                ? "border-primary"
                : linha.subtotal
                  ? "border-primary/40"
                  : "border-border"
            } ${linha.subtotal || linha.destaque ? "rounded-r-lg bg-primary/5 pr-3" : ""}`}
          >
            <span className="flex items-center gap-1.5 text-sm text-foreground/80">
              <span className={linha.subtotal || linha.destaque ? "font-semibold text-foreground" : ""}>
                {linha.label}
              </span>
              <DefinicaoBotao
                chave={linha.key}
                aberto={definicaoAberta === linha.key}
                onToggle={setDefinicaoAberta}
              />
              {linha.comDetalhes && (
                <button
                  type="button"
                  onClick={() => setDetalhesAbertos(true)}
                  className="ml-1 text-xs font-medium text-primary hover:text-primary-dark hover:underline"
                >
                  Detalhes
                </button>
              )}
            </span>
            <span
              className={
                linha.destaque
                  ? `font-display text-xl font-bold sm:text-2xl ${
                      linha.valor >= 0 ? "text-good" : "text-warn"
                    }`
                  : linha.subtotal
                    ? "font-display text-base font-bold text-foreground"
                    : "text-sm font-medium text-foreground/80"
              }
            >
              {formatarMoeda(linha.valor)}
            </span>
          </div>
        ))}
      </div>

      {detalhesAbertos && (
        <Modal title="Quanto custou o que foi vendido" onClose={() => setDetalhesAbertos(false)}>
          {custoPorProduto.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Nenhuma venda ou sessão entregue com custo este mês.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-foreground/60">
                Material, imposto e comissão consumidos por cada produto neste mês —
                do que mais consumiu para o que menos consumiu.
              </p>
              <ul className="flex flex-col gap-2">
                {custoPorProduto.map((item) => (
                  <li
                    key={item.produtoId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                  >
                    <span className="text-sm text-foreground/80">{item.nome}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatarMoeda(item.custo)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5 text-sm font-semibold text-foreground">
                <span>Total</span>
                <span>{formatarMoeda(custoTotalDetalhado)}</span>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
