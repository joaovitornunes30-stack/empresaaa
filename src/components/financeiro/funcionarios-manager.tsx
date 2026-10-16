"use client";

import { useActionState, useState } from "react";
import {
  alternarAtivoFuncionario,
  criarFuncionario,
  editarFuncionario,
  type ActionState,
} from "@/app/(app)/financeiro/actions";
import { Modal } from "@/components/ui/modal";
import { formatarMoeda } from "@/lib/financeiro";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type Funcionario = {
  id: string;
  nome: string;
  tipoContrato: string;
  valorMensal: number;
  usuarioId: string | null;
  ativo: boolean;
};

type Usuario = { id: string; nome: string; email: string };

export function FuncionariosManager({
  funcionarios,
  usuariosDisponiveis,
}: {
  funcionarios: Funcionario[];
  usuariosDisponiveis: Usuario[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary-dark"
      >
        Funcionários
      </button>

      {open && (
        <Modal title="Funcionários" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            {funcionarios.length === 0 && (
              <p className="text-sm text-foreground/60">
                Nenhum funcionário cadastrado ainda.
              </p>
            )}
            {funcionarios.map((funcionario) => (
              <FuncionarioRow
                key={funcionario.id}
                funcionario={funcionario}
                usuariosDisponiveis={usuariosDisponiveis}
              />
            ))}
          </div>

          <div className="my-5 h-px bg-border" />

          <NovoFuncionarioForm usuariosDisponiveis={usuariosDisponiveis} />
        </Modal>
      )}
    </>
  );
}

function FuncionarioRow({
  funcionario,
  usuariosDisponiveis,
}: {
  funcionario: Funcionario;
  usuariosDisponiveis: Usuario[];
}) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(editarFuncionario, initialState);

  if (!editando) {
    return (
      <div
        className={`rounded-xl border px-4 py-3 ${
          funcionario.ativo ? "border-border" : "border-border bg-foreground/[0.03]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {funcionario.nome}
              {!funcionario.ativo && (
                <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground/60">
                  Inativo
                </span>
              )}
            </p>
            <p className="text-xs text-foreground/60">
              {funcionario.tipoContrato} · {formatarMoeda(funcionario.valorMensal)}/mês
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              Editar
            </button>
            <form action={alternarAtivoFuncionario}>
              <input type="hidden" name="id" value={funcionario.id} />
              <button
                type="submit"
                className="text-sm font-medium text-foreground/60 hover:text-foreground"
              >
                {funcionario.ativo ? "Desligar" : "Reativar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
    >
      <input type="hidden" name="id" value={funcionario.id} />
      <div>
        <label className={labelClass}>Nome</label>
        <input
          name="nome"
          type="text"
          required
          defaultValue={funcionario.nome}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo de contrato</label>
          <select
            name="tipoContrato"
            required
            defaultValue={funcionario.tipoContrato}
            className={inputClass}
          >
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Valor mensal (R$)</label>
          <input
            name="valorMensal"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={funcionario.valorMensal}
            className={inputClass}
          />
        </div>
      </div>
      {usuariosDisponiveis.length > 0 && (
        <div>
          <label className={labelClass}>Vincular a um usuário da Equipe (opcional)</label>
          <select
            name="usuarioId"
            defaultValue={funcionario.usuarioId ?? ""}
            className={inputClass}
          >
            <option value="">Nenhum</option>
            {usuariosDisponiveis.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.email})
              </option>
            ))}
          </select>
        </div>
      )}
      {state.error && <p className="text-sm text-warn">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function NovoFuncionarioForm({ usuariosDisponiveis }: { usuariosDisponiveis: Usuario[] }) {
  const [state, formAction, pending] = useActionState(criarFuncionario, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className={labelClass}>Novo funcionário</p>

      <div>
        <label htmlFor="f-nome" className={labelClass}>
          Nome
        </label>
        <input id="f-nome" name="nome" type="text" required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="f-tipo" className={labelClass}>
            Tipo de contrato
          </label>
          <select id="f-tipo" name="tipoContrato" required className={inputClass} defaultValue="CLT">
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-valor" className={labelClass}>
            Valor mensal (R$)
          </label>
          <input
            id="f-valor"
            name="valorMensal"
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
            placeholder="0,00"
          />
        </div>
      </div>

      {usuariosDisponiveis.length > 0 && (
        <div>
          <label htmlFor="f-usuario" className={labelClass}>
            Vincular a um usuário da Equipe (opcional)
          </label>
          <select id="f-usuario" name="usuarioId" className={inputClass} defaultValue="">
            <option value="">Nenhum</option>
            {usuariosDisponiveis.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {state.error && <p className="text-sm text-warn">{state.error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar funcionário"}
        </button>
      </div>
    </form>
  );
}
