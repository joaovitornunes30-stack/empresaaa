import { atualizarObservacoesCliente } from "@/app/clientes/actions";
import type { ClienteDistante } from "@/lib/clientes";

export function PacientesDistantes({ clientes }: { clientes: ClienteDistante[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-4 text-sm italic text-foreground/50">
        &ldquo;O melhor paciente é o que já é seu.&rdquo;
      </p>

      {clientes.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Nenhum paciente distante no momento — todo mundo em dia.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">{cliente.nome}</span>
                <span className="inline-flex rounded-full bg-accent-bg px-2.5 py-0.5 text-xs font-semibold text-accent">
                  há {cliente.dias} dias
                </span>
              </div>
              <form
                action={atualizarObservacoesCliente}
                className="flex flex-1 items-center gap-2 sm:max-w-sm"
              >
                <input type="hidden" name="id" value={cliente.id} />
                <input
                  type="text"
                  name="observacoes"
                  defaultValue={cliente.observacoes ?? ""}
                  placeholder="Observação de follow-up"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium text-primary hover:text-primary-dark"
                >
                  Salvar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
