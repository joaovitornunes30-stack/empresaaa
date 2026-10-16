"use client";

import { useActionState, useState } from "react";
import { atualizarModulosAtivos, type ActionState } from "@/app/(app)/minha-clinica/actions";
import type { ModulosAtivos } from "@/lib/modulos";

const initialState: ActionState = { error: null };

const MODULOS_INFO: { chave: keyof ModulosAtivos; titulo: string; descricao: string }[] = [
  {
    chave: "planos",
    titulo: "Planos com sessões",
    descricao: "Pacotes de múltiplas sessões vendidos a um cliente, com acompanhamento de entrega mês a mês.",
  },
  {
    chave: "protocolo",
    titulo: "Protocolo Personalizado",
    descricao: "Produtos que usam outros produtos como insumo, com custo calculado a partir dos materiais.",
  },
  {
    chave: "indicacoes",
    titulo: "Ranking de Indicações",
    descricao: "Painel com os clientes que mais indicaram outros clientes.",
  },
];

function Switch({
  nome,
  marcado,
  onChange,
}: {
  nome: string;
  marcado: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        name={nome}
        checked={marcado}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="h-6 w-11 rounded-full bg-foreground/15 transition-colors peer-checked:bg-primary" />
      <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

export function ModulosAvancadosForm({ modulosAtuais }: { modulosAtuais: ModulosAtivos }) {
  const [state, formAction, pending] = useActionState(atualizarModulosAtivos, initialState);
  const [modulos, setModulos] = useState(modulosAtuais);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">Módulos avançados</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Desligados por padrão — ligue só o que a sua clínica usa. Desligar não apaga nenhum dado já cadastrado.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {MODULOS_INFO.map((modulo) => (
          <div key={modulo.chave} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-foreground">{modulo.titulo}</p>
              <p className="mt-0.5 text-xs text-foreground/60">{modulo.descricao}</p>
            </div>
            <Switch
              nome={modulo.chave}
              marcado={modulos[modulo.chave]}
              onChange={(valor) => setModulos((atual) => ({ ...atual, [modulo.chave]: valor }))}
            />
          </div>
        ))}
      </div>

      {state.error && (
        <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
