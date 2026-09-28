"use client";

import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "@/lib/financeiro";
import {
  calcularPercentualAcimaRecomendado,
  calcularSemaforoRetirada,
  type EstadoRetiradaSaudavel,
} from "@/lib/retiradas";
import { ConfiguracaoRetiradaButton } from "@/components/retiradas/configuracao-retirada-button";

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
        aria-label="Como calculamos a retirada saudável"
        aria-expanded={aberto}
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-foreground/30 text-[10px] font-semibold leading-none text-foreground/50 hover:border-primary hover:text-primary"
      >
        ?
      </button>
      {aberto && (
        <span className="absolute left-0 top-6 z-20 w-72 rounded-xl border border-border bg-surface p-3 text-xs font-normal leading-relaxed text-foreground/80 shadow-lg">
          Calculamos a média do que sobrou de verdade nos últimos 3 meses fechados. Uma
          parte dessa sobra (a % de reserva que você define) fica guardada na clínica; o
          restante é a retirada saudável. Retirar até a retirada máxima ainda é seguro,
          mas reduz a reserva.
        </span>
      )}
    </span>
  );
}

export function RetiradaSaudavelCard({
  estado,
  totalRetiradoMes,
  percentualAtual,
  proLaboreAtual,
  podeAjustar,
}: {
  estado: EstadoRetiradaSaudavel;
  totalRetiradoMes: number;
  percentualAtual: number;
  proLaboreAtual: number | null;
  podeAjustar: boolean;
}) {
  const semaforo = calcularSemaforoRetirada(estado, totalRetiradoMes);
  const info = SEMAFORO_INFO[semaforo];
  const percentualAcima = calcularPercentualAcimaRecomendado(estado, totalRetiradoMes);

  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="font-display text-base font-semibold text-foreground">
            Retirada saudável
          </h2>
          <InfoBotao />
        </div>
        {podeAjustar && (
          <ConfiguracaoRetiradaButton
            percentualAtual={percentualAtual}
            proLaboreAtual={proLaboreAtual}
          />
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${info.dot}`} />
        <span className={`text-sm font-medium ${info.texto}`}>{info.label}</span>
      </div>

      {estado.estado === "sem_historico_sem_prolabore" ? (
        <p className="text-sm text-foreground/70">
          Ainda não há meses fechados suficientes. Defina um pró-labore combinado para
          começar.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                Retirada saudável
              </p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                {formatarMoeda(estado.retiradaSaudavel)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                Retirada máxima
              </p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                {formatarMoeda(estado.retiradaMaxima)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                Total retirado no mês
              </p>
              <p className={`mt-1 font-display text-xl font-bold ${info.texto}`}>
                {formatarMoeda(totalRetiradoMes)}
              </p>
            </div>
          </div>

          {estado.estado === "sem_historico_com_prolabore" && (
            <p className="mt-4 text-xs text-foreground/60">
              Usando o pró-labore combinado até haver 3 meses de histórico.
            </p>
          )}

          {estado.estado === "com_historico" && estado.proLaboreCombinado !== null && (
            <p className="mt-4 text-xs text-foreground/60">
              Pró-labore combinado de referência: {formatarMoeda(estado.proLaboreCombinado)}
            </p>
          )}

          {percentualAcima !== null && (
            <p className={`mt-3 text-sm ${info.texto}`}>
              Você retirou {percentualAcima.toFixed(0)}% a mais que o recomendado este mês.
            </p>
          )}
        </>
      )}

      <p className="mt-5 border-t border-border pt-3 text-xs text-foreground/40">
        Referência de gestão, não é orientação contábil ou fiscal. Converse com seu
        contador sobre pró-labore.
      </p>
    </div>
  );
}
