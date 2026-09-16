"use client";

import { useActionState, useState } from "react";
import { criarEntradaSaida, type ActionState } from "@/app/financeiro/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

const CATEGORIAS_POR_TIPO: Record<"entrada" | "saida", string[]> = {
  entrada: ["Vendas", "Outras Entradas"],
  saida: [
    "Material",
    "Aluguel",
    "Mídia",
    "Impostos",
    "Salário",
    "Prestador de Serviço",
  ],
};

export function NovaEntradaSaidaButton() {
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [categoria, setCategoria] = useState("");
  const [state, formAction, pending] = useActionState(
    criarEntradaSaida,
    initialState,
  );
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error) {
      setOpen(false);
      setParcelado(false);
      setTipo("entrada");
      setCategoria("");
    }
  }

  function handleClose() {
    setOpen(false);
    setParcelado(false);
    setTipo("entrada");
    setCategoria("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        Nova Entrada/Saída
      </button>

      {open && (
        <Modal title="Nova Entrada/Saída" onClose={handleClose}>
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="tipo" className={labelClass}>
                Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                required
                className={inputClass}
                value={tipo}
                onChange={(event) => {
                  setTipo(event.target.value as "entrada" | "saida");
                  setCategoria("");
                }}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div>
              <label htmlFor="categoria" className={labelClass}>
                Categoria
              </label>
              <input
                id="categoria"
                name="categoria"
                type="text"
                list="categorias-sugeridas"
                required
                className={inputClass}
                placeholder={`Ex: ${CATEGORIAS_POR_TIPO[tipo][0]}`}
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
              />
              <datalist id="categorias-sugeridas">
                {CATEGORIAS_POR_TIPO[tipo].map((sugestao) => (
                  <option key={sugestao} value={sugestao} />
                ))}
              </datalist>
            </div>

            {categoria === "Prestador de Serviço" && (
              <div>
                <label htmlFor="nomePrestador" className={labelClass}>
                  Nome do prestador (opcional)
                </label>
                <input
                  id="nomePrestador"
                  name="nomePrestador"
                  type="text"
                  className={inputClass}
                  placeholder='Ex: "Contador" ou "Fulano - Marketing"'
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className={labelClass}>
                  Valor (R$)
                </label>
                <input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label htmlFor="data" className={labelClass}>
                  Data
                </label>
                <input
                  id="data"
                  name="data"
                  type="date"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="descricao" className={labelClass}>
                Descrição (opcional)
              </label>
              <input
                id="descricao"
                name="descricao"
                type="text"
                className={inputClass}
                placeholder="Detalhes adicionais"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <input
                type="checkbox"
                name="parcelado"
                checked={parcelado}
                onChange={(event) => setParcelado(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Dividir em parcelas
            </label>

            {parcelado && (
              <div>
                <label htmlFor="numeroParcelas" className={labelClass}>
                  Número de parcelas
                </label>
                <input
                  id="numeroParcelas"
                  name="numeroParcelas"
                  type="number"
                  step="1"
                  min="2"
                  required={parcelado}
                  className={inputClass}
                  placeholder="Ex: 12"
                />
              </div>
            )}

            {state.error && (
              <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
                {state.error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
