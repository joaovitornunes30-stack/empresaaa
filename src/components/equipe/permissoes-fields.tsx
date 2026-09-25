"use client";

export type PermissoesValues = {
  acessaProdutos: boolean;
  acessaClientes: boolean;
  acessaFinanceiro: boolean;
  acessaFinanceiroRetiradas: boolean;
  acessaAnalise: boolean;
  acessaEquipe: boolean;
};

export const PERMISSOES_VAZIAS: PermissoesValues = {
  acessaProdutos: false,
  acessaClientes: false,
  acessaFinanceiro: false,
  acessaFinanceiroRetiradas: false,
  acessaAnalise: false,
  acessaEquipe: false,
};

const checkboxClass = "h-4 w-4 rounded border-border accent-primary";
const labelClass = "flex items-center gap-2 text-sm text-foreground/80";

/**
 * Checkboxes de permissão por aba, usados tanto no convite quanto na edição
 * de um membro já cadastrado. "Pode ver Retiradas?" só aparece (e só faz
 * sentido) com Financeiro marcado — desmarcar Financeiro some com ela.
 */
export function PermissoesFields({
  value,
  onChange,
}: {
  value: PermissoesValues;
  onChange: (value: PermissoesValues) => void;
}) {
  function toggle(chave: keyof PermissoesValues) {
    const proximo = { ...value, [chave]: !value[chave] };
    if (chave === "acessaFinanceiro" && !proximo.acessaFinanceiro) {
      proximo.acessaFinanceiroRetiradas = false;
    }
    onChange(proximo);
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border p-3">
      <p className="text-sm font-medium text-foreground/80">Permissões de acesso</p>

      <label className={labelClass}>
        <input
          type="checkbox"
          name="acessaProdutos"
          checked={value.acessaProdutos}
          onChange={() => toggle("acessaProdutos")}
          className={checkboxClass}
        />
        Produtos
      </label>

      <label className={labelClass}>
        <input
          type="checkbox"
          name="acessaClientes"
          checked={value.acessaClientes}
          onChange={() => toggle("acessaClientes")}
          className={checkboxClass}
        />
        Clientes
      </label>

      <label className={labelClass}>
        <input
          type="checkbox"
          name="acessaFinanceiro"
          checked={value.acessaFinanceiro}
          onChange={() => toggle("acessaFinanceiro")}
          className={checkboxClass}
        />
        Financeiro
      </label>

      {value.acessaFinanceiro && (
        <label className={`${labelClass} ml-6 text-foreground/70`}>
          <input
            type="checkbox"
            name="acessaFinanceiroRetiradas"
            checked={value.acessaFinanceiroRetiradas}
            onChange={() => toggle("acessaFinanceiroRetiradas")}
            className={checkboxClass}
          />
          Pode ver Retiradas?
        </label>
      )}

      <label className={labelClass}>
        <input
          type="checkbox"
          name="acessaAnalise"
          checked={value.acessaAnalise}
          onChange={() => toggle("acessaAnalise")}
          className={checkboxClass}
        />
        Análise
      </label>

      <label className={labelClass}>
        <input
          type="checkbox"
          name="acessaEquipe"
          checked={value.acessaEquipe}
          onChange={() => toggle("acessaEquipe")}
          className={checkboxClass}
        />
        Equipe
      </label>
    </div>
  );
}
