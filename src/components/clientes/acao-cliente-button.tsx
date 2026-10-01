"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { VendaModalForm } from "@/components/clientes/venda-modal-form";
import { PlanoModalForm, type PlanoModeloOpcao } from "@/components/clientes/plano-modal-form";

export function AcaoClienteButton({
  clienteId,
  nomeCliente,
  produtos,
  usuarios,
  modelos,
  compact,
  planosAtivo,
}: {
  clienteId: string;
  nomeCliente?: string;
  produtos: { id: string; nome: string }[];
  usuarios: { id: string; nome: string }[];
  modelos: PlanoModeloOpcao[];
  compact?: boolean;
  planosAtivo: boolean;
}) {
  const [modalAberto, setModalAberto] = useState<"escolha" | "venda" | "plano" | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(planosAtivo ? "escolha" : "venda")}
        title={compact ? (planosAtivo ? "Nova venda ou plano" : "Nova venda") : undefined}
        className={
          compact
            ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
            : "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        }
      >
        {compact ? "+" : planosAtivo ? "+ Nova Venda ou Plano" : "+ Nova Venda"}
      </button>

      {modalAberto === "escolha" && (
        <Modal
          title={nomeCliente ? `${nomeCliente}` : "O que você quer criar?"}
          onClose={() => setModalAberto(null)}
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setModalAberto("venda")}
              className="rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="block text-sm font-semibold text-foreground">Nova Venda</span>
              <span className="block text-xs text-foreground/60">
                Lançamento simples de uma venda avulsa.
              </span>
            </button>
            {planosAtivo && (
              <button
                type="button"
                onClick={() => setModalAberto("plano")}
                className="rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="block text-sm font-semibold text-foreground">Novo Plano</span>
                <span className="block text-xs text-foreground/60">
                  Pacote com múltiplos produtos/sessões, com ou sem modelo.
                </span>
              </button>
            )}
          </div>
        </Modal>
      )}

      {modalAberto === "venda" && (
        <VendaModalForm
          clienteId={clienteId}
          nomeCliente={nomeCliente}
          produtos={produtos}
          usuarios={usuarios}
          onClose={() => setModalAberto(null)}
        />
      )}
      {modalAberto === "plano" && planosAtivo && (
        <PlanoModalForm
          clienteId={clienteId}
          nomeCliente={nomeCliente}
          produtos={produtos}
          modelos={modelos}
          onClose={() => setModalAberto(null)}
        />
      )}
    </>
  );
}
