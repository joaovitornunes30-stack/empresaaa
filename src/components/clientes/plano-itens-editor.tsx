"use client";

import { INTERVALOS_PLANO } from "@/lib/planos";
import { formatarMoeda } from "@/lib/financeiro";

export type PlanoItemFormRow = {
  key: string;
  produtoId: string;
  quantidadeSessoes: string;
  valorItem: string;
  intervaloSelecionado: string;
  intervaloPersonalizado: string;
};

let proximaChave = 0;
export function criarItemVazio(): PlanoItemFormRow {
  proximaChave += 1;
  return {
    key: `item-${Date.now()}-${proximaChave}`,
    produtoId: "",
    quantidadeSessoes: "",
    valorItem: "",
    intervaloSelecionado: "",
    intervaloPersonalizado: "",
  };
}

export function criarItemDeModelo(item: {
  produtoId: string;
  quantidadeSessoes: number;
  valorItem: number;
  intervaloDias: number;
}): PlanoItemFormRow {
  const intervaloConhecido = INTERVALOS_PLANO.find((i) => i.dias === item.intervaloDias);
  proximaChave += 1;
  return {
    key: `item-${Date.now()}-${proximaChave}`,
    produtoId: item.produtoId,
    quantidadeSessoes: String(item.quantidadeSessoes),
    valorItem: String(item.valorItem),
    intervaloSelecionado: intervaloConhecido ? String(intervaloConhecido.dias) : "personalizado",
    intervaloPersonalizado: intervaloConhecido ? "" : String(item.intervaloDias),
  };
}

export function resolverIntervaloDias(item: PlanoItemFormRow) {
  if (item.intervaloSelecionado === "personalizado") {
    return parseInt(item.intervaloPersonalizado, 10) || 0;
  }
  return parseInt(item.intervaloSelecionado, 10) || 0;
}

export function calcularTotalItens(itens: PlanoItemFormRow[]) {
  return itens.reduce((total, item) => total + (parseFloat(item.valorItem) || 0), 0);
}

export function itensParaPayload(itens: PlanoItemFormRow[]) {
  return itens.map((item) => ({
    produtoId: item.produtoId,
    quantidadeSessoes: parseInt(item.quantidadeSessoes, 10) || 0,
    valorItem: parseFloat(item.valorItem) || 0,
    intervaloDias: resolverIntervaloDias(item),
  }));
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-medium text-foreground/70";

export function PlanoItensEditor({
  produtos,
  itens,
  onChange,
}: {
  produtos: { id: string; nome: string }[];
  itens: PlanoItemFormRow[];
  onChange: (itens: PlanoItemFormRow[]) => void;
}) {
  function atualizarItem(key: string, patch: Partial<PlanoItemFormRow>) {
    onChange(itens.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removerItem(key: string) {
    onChange(itens.filter((item) => item.key !== key));
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {itens.map((item, index) => (
          <div key={item.key} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Item {index + 1}
              </span>
              {itens.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerItem(item.key)}
                  className="text-xs font-medium text-warn hover:underline"
                >
                  Remover
                </button>
              )}
            </div>

            <div className="mb-3">
              <label className={labelClass}>Produto/serviço</label>
              <select
                required
                className={inputClass}
                value={item.produtoId}
                onChange={(event) => atualizarItem(item.key, { produtoId: event.target.value })}
              >
                <option value="">Selecione</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Quantidade de sessões</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  className={inputClass}
                  placeholder="Ex: 4"
                  value={item.quantidadeSessoes}
                  onChange={(event) =>
                    atualizarItem(item.key, { quantidadeSessoes: event.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Valor deste item (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0,00"
                  value={item.valorItem}
                  onChange={(event) => atualizarItem(item.key, { valorItem: event.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Intervalo entre sessões</label>
                <select
                  required
                  className={inputClass}
                  value={item.intervaloSelecionado}
                  onChange={(event) =>
                    atualizarItem(item.key, { intervaloSelecionado: event.target.value })
                  }
                >
                  <option value="">Selecione</option>
                  {INTERVALOS_PLANO.map((intervalo) => (
                    <option key={intervalo.dias} value={intervalo.dias}>
                      {intervalo.label}
                    </option>
                  ))}
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>
              {item.intervaloSelecionado === "personalizado" && (
                <div>
                  <label className={labelClass}>Dias entre sessões</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    className={inputClass}
                    placeholder="Ex: 21"
                    value={item.intervaloPersonalizado}
                    onChange={(event) =>
                      atualizarItem(item.key, { intervaloPersonalizado: event.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...itens, criarItemVazio()])}
        className="mt-3 rounded-xl border border-dashed border-border px-4 py-2 text-sm font-medium text-primary hover:border-primary hover:bg-primary/5"
      >
        + Adicionar produto/serviço
      </button>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
        <span className="text-sm font-medium text-primary-dark">Valor total do plano</span>
        <span className="font-display text-lg font-bold text-primary-dark">
          {formatarMoeda(calcularTotalItens(itens))}
        </span>
      </div>
    </div>
  );
}
