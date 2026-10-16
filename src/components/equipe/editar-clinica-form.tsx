"use client";

import { useActionState, useState } from "react";
import { editarClinica, type ActionState } from "@/app/(app)/minha-clinica/actions";
import { TIPOS_CLINICA, TIPO_CLINICA_LABEL, formatarCnpj } from "@/lib/clinica-cadastro";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

type EnderecoAtual = {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

export function EditarClinicaForm({
  somenteLeitura,
  nomeAtual,
  tipoClinicaAtual,
  cnpjAtual,
  enderecoAtual,
}: {
  somenteLeitura: boolean;
  nomeAtual: string;
  tipoClinicaAtual: string | null;
  cnpjAtual: string | null;
  enderecoAtual: EnderecoAtual;
}) {
  const [state, formAction, pending] = useActionState(editarClinica, initialState);
  const [cnpj, setCnpj] = useState(cnpjAtual ? formatarCnpj(cnpjAtual) : "");
  const [endereco, setEndereco] = useState({
    cep: enderecoAtual.cep ?? "",
    logradouro: enderecoAtual.logradouro ?? "",
    numero: enderecoAtual.numero ?? "",
    complemento: enderecoAtual.complemento ?? "",
    bairro: enderecoAtual.bairro ?? "",
    cidade: enderecoAtual.cidade ?? "",
    uf: enderecoAtual.uf ?? "",
  });
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);

  async function buscarCep() {
    const cepLimpo = endereco.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    setAvisoCep(null);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resposta.ok) throw new Error("falha na busca");
      const dados = await resposta.json();
      if (dados.erro) {
        setAvisoCep("CEP não encontrado — preencha o endereço manualmente.");
        return;
      }
      setEndereco((atual) => ({
        ...atual,
        logradouro: dados.logradouro || atual.logradouro,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        uf: dados.uf || atual.uf,
      }));
    } catch {
      setAvisoCep("Não foi possível buscar o CEP agora — preencha o endereço manualmente.");
    } finally {
      setBuscandoCep(false);
    }
  }

  if (somenteLeitura) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-foreground">Dados da clínica</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground/50">Nome</dt>
            <dd className="mt-0.5 text-foreground">{nomeAtual}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground/50">Tipo de clínica</dt>
            <dd className="mt-0.5 text-foreground">
              {tipoClinicaAtual && tipoClinicaAtual in TIPO_CLINICA_LABEL
                ? TIPO_CLINICA_LABEL[tipoClinicaAtual as keyof typeof TIPO_CLINICA_LABEL]
                : "Não informado"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground/50">CNPJ</dt>
            <dd className="mt-0.5 text-foreground">{cnpjAtual ? formatarCnpj(cnpjAtual) : "Não informado"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground/50">Endereço</dt>
            <dd className="mt-0.5 text-foreground">
              {endereco.logradouro
                ? `${endereco.logradouro}${endereco.numero ? ", " + endereco.numero : ""}${endereco.complemento ? " - " + endereco.complemento : ""} · ${endereco.bairro} · ${endereco.cidade}/${endereco.uf}`
                : "Não informado"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-base font-semibold text-foreground">Dados da clínica</h2>

      <div>
        <label htmlFor="nome" className={labelClass}>
          Nome da clínica
        </label>
        <input id="nome" name="nome" type="text" required defaultValue={nomeAtual} className={inputClass} />
      </div>

      <div>
        <label htmlFor="tipoClinica" className={labelClass}>
          Tipo de clínica
        </label>
        <select id="tipoClinica" name="tipoClinica" defaultValue={tipoClinicaAtual ?? ""} className={inputClass}>
          <option value="">Não informado</option>
          {TIPOS_CLINICA.map((tipo) => (
            <option key={tipo} value={tipo}>
              {TIPO_CLINICA_LABEL[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cnpj" className={labelClass}>
          CNPJ (opcional)
        </label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          value={cnpj}
          onChange={(event) => setCnpj(formatarCnpj(event.target.value))}
          placeholder="00.000.000/0000-00"
          className={inputClass}
        />
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-foreground/80">Endereço (opcional)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cep" className={labelClass}>
              CEP
            </label>
            <div className="flex gap-2">
              <input
                id="cep"
                name="cep"
                type="text"
                value={endereco.cep}
                onChange={(event) => setEndereco((atual) => ({ ...atual, cep: event.target.value }))}
                onBlur={buscarCep}
                placeholder="00000-000"
                className={inputClass}
              />
              {buscandoCep && <span className="shrink-0 self-center text-xs text-foreground/50">buscando...</span>}
            </div>
            {avisoCep && <p className="mt-1 text-xs text-accent">{avisoCep}</p>}
          </div>
          <div>
            <label htmlFor="logradouro" className={labelClass}>
              Logradouro
            </label>
            <input
              id="logradouro"
              name="logradouro"
              type="text"
              value={endereco.logradouro}
              onChange={(event) => setEndereco((atual) => ({ ...atual, logradouro: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="numero" className={labelClass}>
              Número
            </label>
            <input
              id="numero"
              name="numero"
              type="text"
              value={endereco.numero}
              onChange={(event) => setEndereco((atual) => ({ ...atual, numero: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="complemento" className={labelClass}>
              Complemento
            </label>
            <input
              id="complemento"
              name="complemento"
              type="text"
              value={endereco.complemento}
              onChange={(event) => setEndereco((atual) => ({ ...atual, complemento: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bairro" className={labelClass}>
              Bairro
            </label>
            <input
              id="bairro"
              name="bairro"
              type="text"
              value={endereco.bairro}
              onChange={(event) => setEndereco((atual) => ({ ...atual, bairro: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cidade" className={labelClass}>
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              type="text"
              value={endereco.cidade}
              onChange={(event) => setEndereco((atual) => ({ ...atual, cidade: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="uf" className={labelClass}>
              UF
            </label>
            <input
              id="uf"
              name="uf"
              type="text"
              maxLength={2}
              value={endereco.uf}
              onChange={(event) => setEndereco((atual) => ({ ...atual, uf: event.target.value.toUpperCase() }))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {state.error && <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>}

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
