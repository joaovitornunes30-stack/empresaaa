"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { alternarMapaRecolhido } from "@/app/(app)/home/mapa-actions";
import { FundoMapa, MarcoMapa, estadoVisual } from "@/components/home/mapa-assets";
import type { EstacaoMapa, EstadoMapa, RotaMapa } from "@/lib/mapa-tipos";

const ROTA_HREF: Record<RotaMapa, string> = {
  produtos: "/produtos",
  financeiro: "/financeiro",
  analise: "/analise",
  retiradas: "/retiradas",
  clientes: "/clientes",
};

const ROTA_LABEL: Record<RotaMapa, string> = {
  produtos: "Produtos",
  financeiro: "Financeiro",
  analise: "Análise",
  retiradas: "Retiradas",
  clientes: "Clientes",
};

function calcularPosicoes(n: number, vertical: boolean): { x: number; y: number }[] {
  if (n === 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : (i + 0.5) / n;
    if (vertical) {
      const x = 50 + 22 * Math.sin(i * 1.3);
      return { x, y: t * 100 };
    }
    const y = 50 + 26 * Math.sin(i * 1.3);
    return { x: t * 100, y };
  });
}

function CartaoEstacao({
  estacao,
  somenteLeitura,
  onFechar,
}: {
  estacao: EstacaoMapa;
  somenteLeitura: boolean;
  onFechar: () => void;
}) {
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-foreground/40" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-foreground">{estacao.titulo}</h3>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="shrink-0 text-foreground/50 hover:text-foreground">
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-foreground/70">{estacao.textoDinamico ?? estacao.porque}</p>

        {estacao.subpassos.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2 border-t border-border pt-3">
            {estacao.subpassos.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    s.concluido ? "bg-good text-white" : "border border-border text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={s.concluido ? "text-foreground/50 line-through" : "text-foreground"}>{s.label}</span>
              </li>
            ))}
          </ul>
        )}

        {estacao.conquistadaEm && (
          <p className="mb-3 text-xs text-foreground/50">Conquistada em {estacao.conquistadaEm.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</p>
        )}

        {!somenteLeitura && (
          <Link
            href={ROTA_HREF[estacao.rota]}
            className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            Ir para {ROTA_LABEL[estacao.rota]}
          </Link>
        )}
      </div>
    </div>
  );
}

function Trilha({
  estacoes,
  estacaoAtualId,
  vertical,
  onAbrir,
}: {
  estacoes: EstacaoMapa[];
  estacaoAtualId: string | null;
  vertical: boolean;
  onAbrir: (indice: number) => void;
}) {
  const posicoes = useMemo(() => calcularPosicoes(estacoes.length, vertical), [estacoes.length, vertical]);
  const largura = vertical ? 100 : 100;
  const altura = vertical ? Math.max(100, estacoes.length * 26) : 100;

  const caminho = posicoes
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(p.x / 100) * largura} ${(p.y / 100) * altura}`)
    .join(" ");

  return (
    <div className="relative w-full" style={{ aspectRatio: vertical ? `${largura} / ${altura}` : "3 / 1" }}>
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <FundoMapa largura={largura} altura={altura} />
        {posicoes.length > 1 && <path d={caminho} fill="none" stroke="var(--color-primary)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />}
      </svg>

      {estacoes.map((estacao, i) => {
        const pos = posicoes[i];
        const visual = estadoVisual({ concluida: estacao.concluida, atual: estacao.id === estacaoAtualId, tamanho: estacao.tamanho });
        return (
          <button
            key={estacao.id}
            type="button"
            onClick={() => onAbrir(i)}
            aria-label={`${estacao.titulo} — ${estacao.tipo === "sugestao" ? "sugestão" : estacao.concluida ? "concluída" : estacao.id === estacaoAtualId ? "estação atual" : "pendente"}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <MarcoMapa marco={estacao.marco} tamanho={estacao.tamanho} estado={visual} />
            <span className="max-w-[72px] text-center text-[11px] font-medium leading-tight text-foreground/70">{estacao.titulo}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SeuMapa({
  estado,
  recolhidoInicial,
  somenteLeitura,
}: {
  estado: EstadoMapa;
  recolhidoInicial: boolean;
  somenteLeitura: boolean;
}) {
  const [recolhido, setRecolhido] = useState(recolhidoInicial);
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null);
  const listaId = useId();

  async function alternar() {
    const novo = !recolhido;
    setRecolhido(novo);
    await alternarMapaRecolhido(novo);
  }

  const estacaoAtual = estado.estacoes.find((e) => e.id === estado.estacaoAtualId) ?? null;
  const concluidasCore = estado.estacoes.filter((e) => e.tipo === "obrigatoria" && e.tamanho !== "bonus" && e.concluida).length;
  const percentual = estado.totalObrigatoriasVisiveis === 0 ? 100 : Math.round((concluidasCore / estado.totalObrigatoriasVisiveis) * 100);
  const bonus = estado.estacoes.find((e) => e.tamanho === "bonus");

  if (recolhido) {
    return (
      <section className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-foreground/80">
          <span className="font-medium text-foreground">Seu mapa:</span>{" "}
          {estado.todasObrigatoriasConcluidas ? "Todas as estações concluídas" : estacaoAtual?.titulo ?? "—"}
        </p>
        <button type="button" onClick={alternar} className="shrink-0 text-sm font-semibold text-primary hover:text-primary-dark">
          Abrir mapa
        </button>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Seu mapa</h2>
          <p className="mt-0.5 text-xs font-medium text-foreground/50">
            {estado.todasObrigatoriasConcluidas
              ? `Todas as ${estado.totalObrigatoriasVisiveis} estações concluídas`
              : `Estação ${estado.estacaoAtualIndice} de ${estado.totalObrigatoriasVisiveis}`}
          </p>
        </div>
        <button type="button" onClick={alternar} className="text-sm font-medium text-foreground/50 hover:text-foreground">
          Recolher
        </button>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={percentual} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
      </div>

      <div className="hidden sm:block">
        <Trilha estacoes={estado.estacoes} estacaoAtualId={estado.estacaoAtualId} vertical={false} onAbrir={setIndiceAberto} />
      </div>
      <div className="sm:hidden">
        <Trilha estacoes={estado.estacoes} estacaoAtualId={estado.estacaoAtualId} vertical onAbrir={setIndiceAberto} />
      </div>

      {bonus?.concluida && (
        <p className="mt-4 rounded-xl bg-good-bg px-3 py-2 text-center text-sm font-medium text-good">
          🏁 Parabéns! Você conquistou a estação bônus &ldquo;{bonus.titulo}&rdquo;
          {bonus.conquistadaEm ? ` em ${bonus.conquistadaEm.toLocaleDateString("pt-BR", { timeZone: "UTC" })}` : ""}.
        </p>
      )}

      {/* Lista textual equivalente ao mapa visual, para leitor de tela */}
      <ul id={listaId} className="sr-only">
        {estado.estacoes.map((e) => (
          <li key={e.id}>
            {e.titulo} — {e.tipo === "sugestao" ? "sugestão" : e.concluida ? "concluída" : "pendente"}
          </li>
        ))}
      </ul>

      {indiceAberto !== null && (
        <CartaoEstacao estacao={estado.estacoes[indiceAberto]} somenteLeitura={somenteLeitura} onFechar={() => setIndiceAberto(null)} />
      )}
    </section>
  );
}
