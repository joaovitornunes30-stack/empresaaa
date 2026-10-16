"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { alternarMapaRecolhido } from "@/app/(app)/home/mapa-actions";
import { DefsDoMapa, FundoMapa, MarcoMapa, SeloConquista, TAMANHO_PX, estadoVisual } from "@/components/home/mapa-assets";
import { VIEWBOX_DESKTOP, VIEWBOX_MOBILE, calcularPosicoes, calcularRetanguloRenderizado } from "@/lib/mapa-layout";
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
          <p className="mb-3 flex items-center gap-1.5 text-xs text-foreground/50">
            <SeloConquista tamanho={16} />
            Conquistada em {estacao.conquistadaEm.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
          </p>
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
  const viewBox = vertical ? VIEWBOX_MOBILE : VIEWBOX_DESKTOP;
  const posicoes = useMemo(() => calcularPosicoes(estacoes.length, vertical), [estacoes.length, vertical]);
  const viewport = vertical ? "mobile" : "desktop";

  // O container só tem largura:100% + altura mínima fixa (sem aspect-ratio
  // nenhum) — raramente bate exatamente com a proporção do viewBox. Medir o
  // tamanho real e replicar a conta do preserveAspectRatio="meet" é o que
  // mantém os marcadores exatamente em cima do desenho, em qualquer largura
  // de card.
  const containerRef = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ largura: 0, altura: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observador = new ResizeObserver((entradas) => {
      const { width, height } = entradas[0].contentRect;
      setMedida({ largura: width, altura: height });
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);
  const retangulo = calcularRetanguloRenderizado(medida, viewBox);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl" style={{ minHeight: vertical ? 720 : 460 }}>
      <svg viewBox={`0 0 ${viewBox.largura} ${viewBox.altura}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <DefsDoMapa />
        <FundoMapa largura={viewBox.largura} altura={viewBox.altura} pontos={posicoes} vertical={vertical} />
        {posicoes.length > 1 && (
          <path
            d={posicoes.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeDasharray="7 6"
            strokeLinecap="round"
            opacity={0.55}
          />
        )}
      </svg>

      {estacoes.map((estacao, i) => {
        const pos = posicoes[i];
        const visual = estadoVisual({ concluida: estacao.concluida, atual: estacao.id === estacaoAtualId, tamanho: estacao.tamanho });
        const anteriorConcluida = i === 0 ? false : estacoes[i - 1].concluida;
        const nevoaOpacidade = anteriorConcluida ? 0.28 : 0.72;
        const leftPx = retangulo.x + (pos.x / viewBox.largura) * retangulo.largura;
        const topPx = retangulo.y + (pos.y / viewBox.altura) * retangulo.altura;
        const px = TAMANHO_PX[viewport][estacao.tamanho];

        return (
          <button
            key={estacao.id}
            type="button"
            onClick={() => onAbrir(i)}
            aria-label={`${estacao.titulo} — ${estacao.tipo === "sugestao" ? "sugestão" : estacao.concluida ? "concluída" : estacao.id === estacaoAtualId ? "estação atual" : "pendente"}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ left: leftPx, top: topPx, width: px, height: px }}
          >
            {/* Ícone: preenche o botão (que é do tamanho exato da estação) — centrado exatamente no ponto, independente do rótulo. */}
            <svg width={px} height={px} viewBox={`${-px / 2} ${-px / 2} ${px} ${px}`} overflow="visible" className="pointer-events-none">
              <MarcoMapa marco={estacao.marco} tamanho={estacao.tamanho} estado={visual} viewport={viewport} nevoaOpacidade={nevoaOpacidade} />
            </svg>
            {/* Rótulo: sempre abaixo do ícone, nunca sobre o desenho. Raio
                fixo (não rounded-full) — num rótulo de várias linhas,
                rounded-full "belisca" e corta as letras das pontas. */}
            <span
              className="pointer-events-none absolute left-1/2 top-full mt-1.5 w-max max-w-[76px] -translate-x-1/2 whitespace-normal rounded-md bg-background/90 px-1.5 py-0.5 text-center text-[9.5px] font-medium leading-[1.15] text-foreground/75 shadow-sm"
              style={{ boxShadow: "0 0 0 1px var(--color-border)" }}
            >
              {estacao.titulo}
            </span>
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
    <section className="mb-8 w-full rounded-2xl border border-border bg-surface p-5 sm:p-6">
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

      <div className="hidden w-full sm:block">
        <Trilha estacoes={estado.estacoes} estacaoAtualId={estado.estacaoAtualId} vertical={false} onAbrir={setIndiceAberto} />
      </div>
      <div className="w-full sm:hidden">
        <Trilha estacoes={estado.estacoes} estacaoAtualId={estado.estacaoAtualId} vertical onAbrir={setIndiceAberto} />
      </div>

      {bonus?.concluida && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-good-bg px-3 py-2 text-center text-sm font-medium text-good">
          <SeloConquista tamanho={20} />
          Parabéns! Você conquistou a estação bônus &ldquo;{bonus.titulo}&rdquo;
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
