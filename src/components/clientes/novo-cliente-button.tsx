"use client";

import { useActionState, useState } from "react";
import {
  criarCliente,
  editarCliente,
  type ActionState,
} from "@/app/(app)/clientes/actions";
import { Modal } from "@/components/ui/modal";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

const ORIGENS_SUGERIDAS = ["Instagram", "Indicação", "Google", "Walk-in"];

function paraInputDate(data: Date | null | undefined) {
  return data ? data.toISOString().slice(0, 10) : undefined;
}

type ClienteExistente = {
  id: string;
  nome: string;
  contato: string | null;
  email: string | null;
  cpf: string | null;
  dataNascimento: Date | null;
  dataPrimeiroProcedimento: Date | null;
  origem: string | null;
  indicadoPorId: string | null;
  observacoes: string | null;
};

function ClienteFormFields({
  clientes,
  cliente,
  excluirId,
}: {
  clientes: { id: string; nome: string }[];
  cliente?: ClienteExistente;
  excluirId?: string;
}) {
  const outrosClientes = clientes.filter((c) => c.id !== excluirId);

  return (
    <>
      <div>
        <label htmlFor="nome" className={labelClass}>
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          defaultValue={cliente?.nome}
          className={inputClass}
          placeholder="Nome do cliente"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="contato" className={labelClass}>
            Contato (opcional)
          </label>
          <input
            id="contato"
            name="contato"
            type="text"
            defaultValue={cliente?.contato ?? undefined}
            className={inputClass}
            placeholder="Telefone ou WhatsApp"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail (opcional)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={cliente?.email ?? undefined}
            className={inputClass}
            placeholder="nome@exemplo.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cpf" className={labelClass}>
            CPF (opcional)
          </label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            defaultValue={cliente?.cpf ?? undefined}
            className={inputClass}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label htmlFor="dataNascimento" className={labelClass}>
            Data de nascimento (opcional)
          </label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            type="date"
            defaultValue={paraInputDate(cliente?.dataNascimento)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="dataPrimeiroProcedimento" className={labelClass}>
          Data do primeiro procedimento (opcional)
        </label>
        <input
          id="dataPrimeiroProcedimento"
          name="dataPrimeiroProcedimento"
          type="date"
          defaultValue={paraInputDate(cliente?.dataPrimeiroProcedimento)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="origem" className={labelClass}>
          Origem (opcional)
        </label>
        <input
          id="origem"
          name="origem"
          type="text"
          list="origens-sugeridas"
          defaultValue={cliente?.origem ?? undefined}
          className={inputClass}
          placeholder="Ex: Instagram"
        />
        <datalist id="origens-sugeridas">
          {ORIGENS_SUGERIDAS.map((origem) => (
            <option key={origem} value={origem} />
          ))}
        </datalist>
      </div>

      {outrosClientes.length > 0 && (
        <div>
          <label htmlFor="indicadoPorId" className={labelClass}>
            Indicado por (opcional)
          </label>
          <select
            id="indicadoPorId"
            name="indicadoPorId"
            className={inputClass}
            defaultValue={cliente?.indicadoPorId ?? ""}
          >
            <option value="">Nenhum</option>
            {outrosClientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="observacoes" className={labelClass}>
          Observações (opcional)
        </label>
        <input
          id="observacoes"
          name="observacoes"
          type="text"
          defaultValue={cliente?.observacoes ?? undefined}
          className={inputClass}
          placeholder="Detalhes adicionais"
        />
      </div>
    </>
  );
}

export function NovoClienteButton({
  clientes,
}: {
  clientes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarCliente, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
      >
        Novo Cliente
      </button>

      {open && (
        <Modal title="Novo Cliente" onClose={() => setOpen(false)}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <ClienteFormFields clientes={clientes} />

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
                {pending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function EditarClienteButton({
  cliente,
  clientes,
}: {
  cliente: ClienteExistente;
  clientes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(editarCliente, initialState);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [lastHandledState, setLastHandledState] = useState(state);

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (submittedOnce && !state.error) {
      setOpen(false);
      setSubmittedOnce(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-primary hover:text-primary-dark"
      >
        Editar
      </button>

      {open && (
        <Modal title="Editar Cliente" onClose={() => setOpen(false)}>
          <form
            action={(formData) => {
              setSubmittedOnce(true);
              formAction(formData);
            }}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="id" value={cliente.id} />
            <ClienteFormFields clientes={clientes} cliente={cliente} excluirId={cliente.id} />

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
                {pending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
