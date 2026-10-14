"use client";

import { useState } from "react";
import { formatarMoeda } from "@/lib/financeiro";
import type { DiagnosticoRenda, PesoFinanceiro } from "@/lib/diagnostico-renda";
import { PESO_LABEL } from "@/lib/diagnostico-renda";
import type { SaidaEmNumerosResultado } from "@/lib/saida-em-numeros";

const FAIXA_INFO: Record<"abaixo_preciso" | "entre_preciso_e_quero" | "acima_quero", { texto: string; classe: string }> = {
  abaixo_preciso: { texto: "Abaixo do que você precisa", classe: "text-muted-red" },
  entre_preciso_e_quero: { texto: "Cobre o essencial, ainda não a meta", classe: "text-accent" },
  acima_quero: { texto: "Acima da sua meta — folga", classe: "text-good" },
};

function SaidaEmNumerosBloco({
  falta,
  resultado,
}: {
  falta: number;
  resultado: SaidaEmNumerosResultado | null;
}) {
  if (falta <= 0) {
    return <p className="text-sm text-foreground/60">Não falta nada para essa meta — ela já está coberta.</p>;
  }
  if (!resultado || resultado.tipo === "sem_produto_com_margem") {
    return <p className="text-sm text-foreground/60">Cadastre produtos com custo para ver este cálculo.</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Falta por mês</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">{formatarMoeda(resultado.faltaPorMes)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Resultado extra necessário</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">{formatarMoeda(resultado.resultadoExtraNecessario)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {resultado.quantidadeNecessaria} × {resultado.produtoNome}
          </p>
          <p className="mt-1 font-display text-base font-bold text-foreground">
            {resultado.quantidadeNecessaria} un.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Faturamento extra</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">{formatarMoeda(resultado.faturamentoExtra)}</p>
        </div>
      </div>

      {resultado.planoEquivalente && (
        <p className="mt-3 text-xs text-foreground/60">
          Equivalente em planos: {resultado.planoEquivalente.quantidadeSessoes} sessões de{" "}
          {resultado.planoEquivalente.nome}.
        </p>
      )}

      <p className="mt-3 text-xs text-foreground/40">
        Considerando que seus custos fixos não aumentem.
      </p>
    </div>
  );
}

export function DiagnosticoRendaCard({
  diagnostico,
  maiorPeso,
  consultorContato,
  somaPreciso,
  somaQuero,
  retiradaIdealTotal,
  saidaPreciso,
  saidaQuero,
}: {
  diagnostico: DiagnosticoRenda;
  maiorPeso: PesoFinanceiro | null;
  consultorContato: { nome: string; email: string } | null;
  somaPreciso: number;
  somaQuero: number;
  retiradaIdealTotal: number;
  saidaPreciso: SaidaEmNumerosResultado | null;
  saidaQuero: SaidaEmNumerosResultado | null;
}) {
  const [metaEscolhida, setMetaEscolhida] = useState<"preciso" | "quero">(
    diagnostico.tipo === "com_custo_de_vida" && diagnostico.faixa === "abaixo_preciso" ? "preciso" : "quero",
  );

  if (diagnostico.tipo === "sem_custo_de_vida") return null;

  const info = FAIXA_INFO[diagnostico.faixa];
  const faltaPreciso = somaPreciso - retiradaIdealTotal;
  const faltaQuero = somaQuero - retiradaIdealTotal;

  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-4 font-display text-base font-semibold text-foreground">Diagnóstico de renda</h2>

      <div className="mb-4 flex items-center gap-2">
        <span className={`text-sm font-medium ${info.classe}`}>{info.texto}</span>
      </div>

      {diagnostico.faixa === "abaixo_preciso" && diagnostico.causa === "clinica_nao_saudavel" && (
        <div className="mb-4 rounded-xl bg-muted-red-bg p-4">
          <p className="font-display text-base font-semibold text-muted-red">O foco hoje é a clínica</p>
          <p className="mt-1 text-sm text-foreground/70">
            A clínica ainda não está sobrando o suficiente para sustentar nenhuma retirada maior.
            {maiorPeso && ` O que mais pesa hoje é ${PESO_LABEL[maiorPeso]}.`}
          </p>
        </div>
      )}

      {diagnostico.faixa === "abaixo_preciso" && diagnostico.causa === "estrutura_insuficiente" && (
        <div className="mb-4 rounded-xl bg-accent-bg p-4">
          <p className="text-sm text-foreground/80">
            Sua clínica rende, mas a renda que você precisa não é viável com a estrutura atual. Vamos
            pensar juntos no caminho.
          </p>
          {consultorContato && (
            <a
              href={`mailto:${consultorContato.email}`}
              className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
            >
              Conversar com um consultor
            </a>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">Ver quanto falta para:</span>
          <div className="inline-flex rounded-xl border border-border p-0.5">
            <button
              type="button"
              onClick={() => setMetaEscolhida("preciso")}
              className={`rounded-lg px-3 py-1 text-xs font-medium ${metaEscolhida === "preciso" ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
            >
              Preciso
            </button>
            <button
              type="button"
              onClick={() => setMetaEscolhida("quero")}
              className={`rounded-lg px-3 py-1 text-xs font-medium ${metaEscolhida === "quero" ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
            >
              Quero
            </button>
          </div>
        </div>

        <SaidaEmNumerosBloco
          falta={metaEscolhida === "preciso" ? faltaPreciso : faltaQuero}
          resultado={metaEscolhida === "preciso" ? saidaPreciso : saidaQuero}
        />
      </div>
    </div>
  );
}
