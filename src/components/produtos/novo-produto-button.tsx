"use client";

import { useActionState, useState } from "react";
import { criarProduto, type ActionState } from "@/app/(app)/produtos/actions";
import { Modal } from "@/components/ui/modal";
import { formatarMoeda } from "@/lib/calculos";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type MaterialDisponivel = { id: string; nome: string; custoMedioMaterial: number };

type ItemProtocoloForm = {
  key: string;
  materialId: string;
  quantidade: string;
};

let proximaChaveProtocolo = 0;
function criarItemProtocoloVazio(): ItemProtocoloForm {
  proximaChaveProtocolo += 1;
  return { key: `protocolo-item-${Date.now()}-${proximaChaveProtocolo}`, materialId: "", quantidade: "" };
}

export function NovoProdutoButton({
  perfis,
  materiaisDisponiveis,
}: {
  perfis: { id: string; nome: string; aliquota: number }[];
  materiaisDisponiveis: MaterialDisponivel[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    criarProduto,
    initialState,
  );
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);
  const [comissaoTipo, setComissaoTipo] = useState<"percentual" | "fixo">(
    "percentual",
  );
  const [isProtocolo, setIsProtocolo] = useState(false);
  const [itensProtocolo, setItensProtocolo] = useState<ItemProtocoloForm[]>([
    criarItemProtocoloVazio(),
  ]);

  const materialPorId = new Map(materiaisDisponiveis.map((m) => [m.id, m]));
  const custoProtocoloCalculado = itensProtocolo.reduce((total, item) => {
    const material = materialPorId.get(item.materialId);
    const quantidade = parseFloat(item.quantidade) || 0;
    return total + (material ? material.custoMedioMaterial * quantidade : 0);
  }, 0);

  function atualizarItemProtocolo(key: string, patch: Partial<ItemProtocoloForm>) {
    setItensProtocolo((itens) =>
      itens.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removerItemProtocolo(key: string) {
    setItensProtocolo((itens) => itens.filter((item) => item.key !== key));
  }

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
      setIsProtocolo(false);
      setItensProtocolo([criarItemProtocoloVazio()]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={perfis.length === 0}
        title={
          perfis.length === 0
            ? "Cadastre um perfil tributário primeiro"
            : undefined
        }
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Novo Produto
      </button>

      {open && (
        <Modal title="Novo Produto" onClose={() => setOpen(false)}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="nome" className={labelClass}>
                Nome do produto
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className={inputClass}
                placeholder="Ex: Limpeza de Pele"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="precoVenda" className={labelClass}>
                  Valor por hora (R$)
                </label>
                <input
                  id="precoVenda"
                  name="precoVenda"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label htmlFor="custoMedioMaterial" className={labelClass}>
                  Custo médio material (R$)
                </label>
                {isProtocolo ? (
                  <div
                    className={`${inputClass} flex items-center bg-foreground/5 text-foreground/70`}
                    title={
                      itensProtocolo
                        .filter((item) => item.materialId)
                        .map((item) => {
                          const material = materialPorId.get(item.materialId);
                          const quantidade = parseFloat(item.quantidade) || 0;
                          return material
                            ? `${material.nome}: ${formatarMoeda(material.custoMedioMaterial)} × ${quantidade} = ${formatarMoeda(material.custoMedioMaterial * quantidade)}`
                            : "";
                        })
                        .filter(Boolean)
                        .join("\n") || "Adicione materiais ao protocolo"
                    }
                  >
                    {formatarMoeda(custoProtocoloCalculado)} (calculado)
                  </div>
                ) : (
                  <input
                    id="custoMedioMaterial"
                    name="custoMedioMaterial"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={inputClass}
                    placeholder="0,00"
                  />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="duracaoMinutos" className={labelClass}>
                Duração (minutos)
              </label>
              <input
                id="duracaoMinutos"
                name="duracaoMinutos"
                type="number"
                step="1"
                min="1"
                required
                className={inputClass}
                placeholder="Ex: 45"
              />
            </div>

            <div className="rounded-xl border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <input
                  type="checkbox"
                  checked={isProtocolo}
                  onChange={(event) => setIsProtocolo(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                Este produto é um protocolo (usa outros produtos como insumo)?
              </label>

              {isProtocolo && (
                <div className="mt-3 flex flex-col gap-3">
                  {materiaisDisponiveis.length === 0 ? (
                    <p className="text-sm text-foreground/60">
                      Cadastre outros produtos primeiro para usá-los como material.
                    </p>
                  ) : (
                    <>
                      {itensProtocolo.map((item, index) => (
                        <div key={item.key} className="rounded-xl border border-border p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                              Material {index + 1}
                            </span>
                            {itensProtocolo.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removerItemProtocolo(item.key)}
                                className="text-xs font-medium text-warn hover:underline"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-foreground/70">
                                Produto/material
                              </label>
                              <select
                                required
                                className={inputClass}
                                value={item.materialId}
                                onChange={(event) =>
                                  atualizarItemProtocolo(item.key, {
                                    materialId: event.target.value,
                                  })
                                }
                              >
                                <option value="">Selecione</option>
                                {materiaisDisponiveis.map((material) => (
                                  <option key={material.id} value={material.id}>
                                    {material.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-foreground/70">
                                Quantidade usada
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className={inputClass}
                                placeholder="Ex: 1"
                                value={item.quantidade}
                                onChange={(event) =>
                                  atualizarItemProtocolo(item.key, {
                                    quantidade: event.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setItensProtocolo((itens) => [...itens, criarItemProtocoloVazio()])
                        }
                        className="rounded-xl border border-dashed border-border px-4 py-2 text-sm font-medium text-primary hover:border-primary hover:bg-primary/5"
                      >
                        + Adicionar material ao protocolo
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isProtocolo && (
              <>
                <input type="hidden" name="custoMedioMaterial" value="0" />
                <input
                  type="hidden"
                  name="protocoloItensJson"
                  value={JSON.stringify(
                    itensProtocolo
                      .filter((item) => item.materialId && item.quantidade)
                      .map((item) => ({
                        materialId: item.materialId,
                        quantidade: parseFloat(item.quantidade) || 0,
                      })),
                  )}
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="comissaoTipo" className={labelClass}>
                  Tipo de comissão
                </label>
                <select
                  id="comissaoTipo"
                  name="comissaoTipo"
                  required
                  className={inputClass}
                  value={comissaoTipo}
                  onChange={(event) =>
                    setComissaoTipo(event.target.value as "percentual" | "fixo")
                  }
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="fixo">Valor fixo (R$)</option>
                </select>
              </div>
              <div>
                <label htmlFor="comissaoValor" className={labelClass}>
                  Comissão {comissaoTipo === "percentual" ? "(%)" : "(R$)"}
                </label>
                <input
                  id="comissaoValor"
                  name="comissaoValor"
                  type="number"
                  step="0.01"
                  min="0"
                  max={comissaoTipo === "percentual" ? 100 : undefined}
                  required
                  className={inputClass}
                  placeholder={comissaoTipo === "percentual" ? "0" : "0,00"}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="divisorCustoEspaco"
                className={`${labelClass} inline-flex items-center gap-1.5`}
              >
                Divisor de custo de espaço
                <span
                  title="Número mínimo de produtos/procedimentos costumeiramente executados em paralelo no mesmo espaço/horário. Usado futuramente para ratear o custo de estrutura por hora — por enquanto é apenas armazenado."
                  className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-foreground/30 text-[10px] font-semibold leading-none text-foreground/50"
                >
                  ?
                </span>
              </label>
              <input
                id="divisorCustoEspaco"
                name="divisorCustoEspaco"
                type="number"
                step="1"
                min="1"
                required
                defaultValue={1}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="perfilTributarioId" className={labelClass}>
                Perfil tributário
              </label>
              <select
                id="perfilTributarioId"
                name="perfilTributarioId"
                required
                className={inputClass}
              >
                {perfis.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome} ({perfil.aliquota}%)
                  </option>
                ))}
              </select>
            </div>

            {state.error && (
              <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
                {state.error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Salvar produto"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
