"use client";

import { useActionState, useMemo, useState } from "react";
import { salvarCustoDeVida, type ActionState } from "@/app/(app)/retiradas/custo-de-vida-actions";
import { Modal } from "@/components/ui/modal";
import { formatarMoeda } from "@/lib/financeiro";
import type { CustoDeVidaDados } from "@/lib/custo-de-vida";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

function EditarCustoDeVidaForm({
  dados,
  onClose,
}: {
  dados: CustoDeVidaDados | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(salvarCustoDeVida, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  const [moradia, setMoradia] = useState(dados?.moradia?.toString() ?? "");
  const [gastosBasicos, setGastosBasicos] = useState(dados?.gastosBasicos?.toString() ?? "");
  const [cartao, setCartao] = useState(dados?.cartao?.toString() ?? "");
  const [outros, setOutros] = useState(dados?.outros?.toString() ?? "");
  const [preciso, setPreciso] = useState(dados?.preciso?.toString() ?? "");

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) onClose();
  }

  const somaDetalhamento = useMemo(
    () => [moradia, gastosBasicos, cartao, outros].reduce((total, v) => total + (parseFloat(v) || 0), 0),
    [moradia, gastosBasicos, cartao, outros],
  );
  const temDetalhamento = [moradia, gastosBasicos, cartao, outros].some((v) => v.trim() !== "");

  return (
    <form
      action={(formData) => {
        setSubmittedOnce(true);
        formAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-foreground/70">
        Preencha se a sua renda depende exclusivamente da clínica. Totalmente opcional, e
        só você enxerga estes valores — nem outro dono, nem membro, nem consultor vê.
      </p>

      <div className="rounded-xl border border-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Detalhamento (opcional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="moradia" className={labelClass}>Moradia</label>
            <input id="moradia" name="moradia" type="number" step="0.01" min="0" value={moradia} onChange={(e) => setMoradia(e.target.value)} className={inputClass} placeholder="0,00" />
          </div>
          <div>
            <label htmlFor="gastosBasicos" className={labelClass}>Gastos básicos</label>
            <input id="gastosBasicos" name="gastosBasicos" type="number" step="0.01" min="0" value={gastosBasicos} onChange={(e) => setGastosBasicos(e.target.value)} className={inputClass} placeholder="0,00" />
          </div>
          <div>
            <label htmlFor="cartao" className={labelClass}>Cartão</label>
            <input id="cartao" name="cartao" type="number" step="0.01" min="0" value={cartao} onChange={(e) => setCartao(e.target.value)} className={inputClass} placeholder="0,00" />
          </div>
          <div>
            <label htmlFor="outros" className={labelClass}>Outros</label>
            <input id="outros" name="outros" type="number" step="0.01" min="0" value={outros} onChange={(e) => setOutros(e.target.value)} className={inputClass} placeholder="0,00" />
          </div>
        </div>
        {temDetalhamento && (
          <button
            type="button"
            onClick={() => setPreciso(somaDetalhamento.toFixed(2))}
            className="mt-3 text-xs font-medium text-primary hover:text-primary-dark"
          >
            Usar a soma ({formatarMoeda(somaDetalhamento)}) como &quot;Preciso por mês&quot;
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="preciso" className={labelClass}>Preciso por mês</label>
          <input id="preciso" name="preciso" type="number" step="0.01" min="0.01" required value={preciso} onChange={(e) => setPreciso(e.target.value)} className={inputClass} placeholder="0,00" />
          <p className="mt-1 text-xs text-foreground/50">Mínimo para viver.</p>
        </div>
        <div>
          <label htmlFor="quero" className={labelClass}>Quero por mês</label>
          <input id="quero" name="quero" type="number" step="0.01" min="0.01" required defaultValue={dados?.quero ?? undefined} className={inputClass} placeholder="0,00" />
          <p className="mt-1 text-xs text-foreground/50">Sua meta de renda.</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <input type="checkbox" name="ativo" defaultChecked={dados?.ativo ?? false} className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30" />
        Calcular com base no meu custo de vida
      </label>
      <p className="-mt-2 text-xs text-foreground/50">
        Desligado: a análise usa o pró-labore alvo já combinado, não estes valores.
      </p>

      {state.error && <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>}

      <div className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5">
          Cancelar
        </button>
        <button type="submit" disabled={pending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function MeuCustoDeVidaBloco({
  dados,
  minhaRetiradaMes,
}: {
  dados: CustoDeVidaDados | null;
  minhaRetiradaMes: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(false);

  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
      >
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Meu custo de vida</h2>
          {!aberto && (
            <p className="mt-1 text-sm text-foreground/60">
              Preencha se a sua renda depende exclusivamente da clínica.
            </p>
          )}
        </div>
        <span className="text-foreground/40">{aberto ? "–" : "+"}</span>
      </button>

      {aberto && (
        <div className="border-t border-border p-5 sm:p-6">
          {dados ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Preciso</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">{formatarMoeda(dados.preciso ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Quero</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">{formatarMoeda(dados.quero ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Sua retirada no mês</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">{formatarMoeda(minhaRetiradaMes)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-foreground/60">
                {dados.ativo
                  ? "Entrando na soma usada pela análise da clínica."
                  : "Desligado — não está entrando na análise da clínica."}
              </p>
            </>
          ) : (
            <p className="text-sm text-foreground/60">Você ainda não preencheu seu custo de vida.</p>
          )}

          <button
            type="button"
            onClick={() => setEditando(true)}
            className="mt-4 text-xs font-medium text-primary hover:text-primary-dark"
          >
            {dados ? "Editar" : "Preencher"}
          </button>
        </div>
      )}

      {editando && (
        <Modal title="Meu custo de vida" onClose={() => setEditando(false)}>
          <EditarCustoDeVidaForm dados={dados} onClose={() => setEditando(false)} />
        </Modal>
      )}
    </div>
  );
}
