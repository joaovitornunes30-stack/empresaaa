"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  escolherObjetivo,
  dispensarChecklist,
  type ActionState,
} from "@/app/(app)/home/actions";
import {
  OBJETIVOS_CARTAO,
  OBJETIVO_LABEL,
  OBJETIVO_TEXTO_MAX,
  PASSO_LABEL,
  PASSO_ROTA,
  type ObjetivoPrincipal,
  type ProgressoChecklist,
} from "@/lib/checklist";

const initialState: ActionState = { error: null };

function PickerObjetivo({
  objetivoAtual,
  onCancelar,
  onSalvo,
}: {
  objetivoAtual: ObjetivoPrincipal | null;
  onCancelar: (() => void) | null;
  onSalvo: () => void;
}) {
  const [state, formAction, pending] = useActionState(escolherObjetivo, initialState);
  const [selecionado, setSelecionado] = useState<ObjetivoPrincipal | null>(
    objetivoAtual && objetivoAtual !== "pular" ? objetivoAtual : null,
  );
  const [texto, setTexto] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submetidoRef = useRef(false);

  useEffect(() => {
    if (!submetidoRef.current) return;
    submetidoRef.current = false;
    if (!state.error) onSalvo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function pular() {
    setSelecionado("pular");
    // O estado só é aplicado no próximo render — adia o submit pro próximo
    // tick pra garantir que o input escondido já reflita "pular".
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        submetidoRef.current = true;
        return formAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">
          Qual é o seu principal objetivo com o Aivy?
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          Isso ajusta os próximos passos sugeridos abaixo — você pode trocar quando quiser.
        </p>
      </div>

      <input type="hidden" name="objetivoPrincipal" value={selecionado ?? ""} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OBJETIVOS_CARTAO.map((objetivo) => (
          <button
            key={objetivo}
            type="button"
            onClick={() => setSelecionado(objetivo)}
            className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
              selecionado === objetivo
                ? "border-primary bg-primary/10 text-primary-dark"
                : "border-border bg-background text-foreground/80 hover:border-primary/50"
            }`}
          >
            {OBJETIVO_LABEL[objetivo]}
          </button>
        ))}
      </div>

      {selecionado === "outro" && (
        <div>
          <textarea
            name="objetivoTexto"
            value={texto}
            onChange={(event) => setTexto(event.target.value.slice(0, OBJETIVO_TEXTO_MAX))}
            maxLength={OBJETIVO_TEXTO_MAX}
            placeholder="Conte rapidamente qual é o seu objetivo (opcional)"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-foreground/40">
            {texto.length}/{OBJETIVO_TEXTO_MAX}
          </p>
        </div>
      )}

      {state.error && <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={pular}
          className="text-sm font-medium text-foreground/60 hover:text-foreground"
        >
          Pular por enquanto
        </button>
        <div className="flex gap-2">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-foreground/5"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={pending || !selecionado}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ChecklistPassos({ progresso }: { progresso: ProgressoChecklist }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {progresso.passos.map(({ passo, concluido }) => (
        <li key={passo} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                concluido ? "bg-good text-white" : "border border-border text-transparent"
              }`}
            >
              ✓
            </span>
            <span className={`text-sm ${concluido ? "text-foreground/50 line-through" : "text-foreground"}`}>
              {PASSO_LABEL[passo]}
            </span>
          </div>
          {!concluido && (
            <Link href={PASSO_ROTA[passo]} className="shrink-0 text-xs font-semibold text-primary hover:text-primary-dark">
              Ir
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ComecePorAquiBloco({
  objetivoPrincipal,
  objetivoTexto,
  checklistDispensada,
  progresso,
}: {
  objetivoPrincipal: ObjetivoPrincipal | null;
  objetivoTexto: string | null;
  checklistDispensada: boolean;
  progresso: ProgressoChecklist;
}) {
  const [trocando, setTrocando] = useState(false);
  const [, dispensarAction] = useActionState(dispensarChecklist, initialState);

  const objetivoEscolhido = objetivoPrincipal !== null;

  const descricaoObjetivo =
    objetivoPrincipal === "outro" && objetivoTexto ? objetivoTexto : objetivoPrincipal ? OBJETIVO_LABEL[objetivoPrincipal] : null;

  if (!objetivoEscolhido || trocando) {
    return (
      <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <PickerObjetivo
          objetivoAtual={objetivoPrincipal}
          onCancelar={objetivoEscolhido ? () => setTrocando(false) : null}
          onSalvo={() => setTrocando(false)}
        />
      </section>
    );
  }

  // Efeito 3: o cartão "Seu objetivo" continua aparecendo mesmo com a
  // checklist concluída ou dispensada — só que recolhido, sem os passos.
  if (checklistDispensada || progresso.completa) {
    return (
      <section className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-foreground/80">
          <span className="font-medium text-foreground">Seu objetivo:</span> {descricaoObjetivo}
        </p>
        <button type="button" onClick={() => setTrocando(true)} className="text-sm font-semibold text-primary hover:text-primary-dark">
          Trocar
        </button>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Comece por aqui</h2>
          <p className="mt-0.5 text-sm text-foreground/60">
            <span className="font-medium text-foreground/80">Seu objetivo:</span> {descricaoObjetivo} ·{" "}
            <button type="button" onClick={() => setTrocando(true)} className="font-semibold text-primary hover:text-primary-dark">
              Trocar
            </button>
          </p>
        </div>
        <span className="text-xs font-medium text-foreground/50">
          {progresso.concluidos}/{progresso.total} concluídos
        </span>
      </div>

      <ChecklistPassos progresso={progresso} />

      <form action={dispensarAction} className="mt-4 flex justify-end border-t border-border pt-3">
        <button type="submit" className="text-xs font-medium text-foreground/50 hover:text-foreground">
          Dispensar por enquanto
        </button>
      </form>
    </section>
  );
}
