"use client";

import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "@/lib/financeiro";
import type { EstadoRetiradaSaudavel } from "@/lib/retiradas";
import type { RetiradaIdealResultado } from "@/lib/caixa-livre";
import { calcularSemaforoRetiradaIdeal } from "@/lib/caixa-livre";
import { ConfiguracaoRetiradaButton } from "@/components/retiradas/configuracao-retirada-button";
import { AjusteCalculoButton } from "@/components/retiradas/ajuste-calculo-button";

const SEMAFORO_INFO: Record<
  "verde" | "laranja" | "vermelho" | "cinza",
  { dot: string; texto: string; label: string }
> = {
  verde: { dot: "bg-good", texto: "text-good", label: "Dentro do recomendado" },
  laranja: { dot: "bg-accent", texto: "text-accent", label: "Atenção: perto do limite" },
  vermelho: { dot: "bg-muted-red", texto: "text-muted-red", label: "Acima do recomendado" },
  cinza: { dot: "bg-foreground/25", texto: "text-foreground/50", label: "Sem dado suficiente" },
};

function InfoBotao() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener("click", aoClicarFora);
    return () => document.removeEventListener("click", aoClicarFora);
  }, [aberto]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Como calculamos a retirada ideal"
        aria-expanded={aberto}
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-foreground/30 text-[10px] font-semibold leading-none text-foreground/50 hover:border-primary hover:text-primary"
      >
        ?
      </button>
      {aberto && (
        <span className="absolute left-0 top-6 z-20 w-80 rounded-xl border border-border bg-surface p-3 text-xs font-normal leading-relaxed text-foreground/80 shadow-lg">
          Retirada ideal é o menor valor entre a Retirada saudável (média do que
          sobrou nos últimos meses fechados) e o Caixa livre (o que sobra no caixa
          depois de reservar o que já está programado para sair e uma reserva
          mínima de segurança).
        </span>
      )}
    </span>
  );
}

export function RetiradaIdealCard({
  resultado,
  estadoSaudavel,
  totalRetiradoMes,
  percentualAtual,
  proLaboreAtual,
  horizonteAtual,
  reservaAtual,
  podeAjustarConfig,
  podeAjustarCalculo,
}: {
  resultado: RetiradaIdealResultado;
  estadoSaudavel: EstadoRetiradaSaudavel;
  totalRetiradoMes: number;
  percentualAtual: number;
  proLaboreAtual: number | null;
  horizonteAtual: number;
  reservaAtual: number;
  podeAjustarConfig: boolean;
  podeAjustarCalculo: boolean;
}) {
  const semaforo = calcularSemaforoRetiradaIdeal(resultado, estadoSaudavel, totalRetiradoMes);
  const info = SEMAFORO_INFO[semaforo];

  const fraseFiltro =
    resultado.estado === "nao_retire_agora"
      ? `O caixa livre está negativo (${formatarMoeda(resultado.caixaLivre.caixaLivre)}) — as saídas já programadas e a reserva mínima pesam mais do que o caixa disponível agora.`
      : resultado.estado === "calculado"
        ? resultado.filtroLimitante === "caixa"
          ? "Limitado pelo caixa disponível: mesmo com uma retirada saudável maior, o caixa livre não cobre esse valor agora."
          : resultado.filtroLimitante === "saudavel"
            ? "Limitado pela retirada saudável: o caixa livre comportaria mais, mas reter essa sobra mantém a reserva da clínica."
            : "Caixa livre e retirada saudável no mesmo valor."
        : null;

  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="font-display text-base font-semibold text-foreground">Retirada ideal</h2>
          <InfoBotao />
        </div>
        <div className="flex items-center gap-4">
          {podeAjustarConfig && (
            <ConfiguracaoRetiradaButton percentualAtual={percentualAtual} proLaboreAtual={proLaboreAtual} />
          )}
          {podeAjustarCalculo && (
            <AjusteCalculoButton horizonteAtual={horizonteAtual} reservaAtual={reservaAtual} />
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${info.dot}`} />
        <span className={`text-sm font-medium ${info.texto}`}>{info.label}</span>
      </div>

      {resultado.estado === "sem_dado" ? (
        <p className="text-sm text-foreground/70">
          Ainda não há meses fechados suficientes. Defina um pró-labore combinado para começar.
        </p>
      ) : (
        <>
          {resultado.estado === "nao_retire_agora" && (
            <p className="mb-4 font-display text-lg font-bold text-muted-red">Não retire agora</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Retirada ideal</p>
              <p className={`mt-1 font-display text-xl font-bold ${resultado.estado === "nao_retire_agora" ? "text-muted-red" : "text-foreground"}`}>
                {formatarMoeda(resultado.estado === "nao_retire_agora" ? 0 : resultado.retiradaIdeal)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Retirada saudável</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                {formatarMoeda(estadoSaudavel.estado === "sem_historico_sem_prolabore" ? 0 : estadoSaudavel.retiradaSaudavel)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Caixa livre</p>
              <p className={`mt-1 font-display text-xl font-bold ${resultado.caixaLivre.caixaLivre < 0 ? "text-muted-red" : "text-foreground"}`}>
                {formatarMoeda(resultado.caixaLivre.caixaLivre)}
              </p>
            </div>
          </div>

          {fraseFiltro && <p className="mt-4 text-sm text-foreground/70">{fraseFiltro}</p>}

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Total retirado no mês</p>
            <p className={`mt-1 font-display text-xl font-bold ${info.texto}`}>{formatarMoeda(totalRetiradoMes)}</p>
          </div>
        </>
      )}

      <p className="mt-5 border-t border-border pt-3 text-xs text-foreground/40">
        Referência de gestão, não é orientação contábil ou fiscal. Converse com seu contador sobre pró-labore.
      </p>
    </div>
  );
}
