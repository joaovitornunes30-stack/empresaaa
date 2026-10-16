import { marcarAnotacaoConsultorResolvida } from "@/app/(app)/analise/actions";
import { NovaAnotacaoConsultorForm } from "@/components/analise/nova-anotacao-consultor-form";

export type AnotacaoConsultorItem = {
  id: string;
  texto: string;
  resolvida: boolean;
  createdAt: Date;
  autorNome: string;
};

function formatarDataHora(data: Date) {
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function AnotacoesConsultorSection({
  anotacoes,
  podeAdicionar,
}: {
  anotacoes: AnotacaoConsultorItem[];
  podeAdicionar: boolean;
}) {
  return (
    <div>
      <h2 className="mb-3 font-display text-base font-semibold text-foreground">
        Anotações do Consultor
      </h2>

      {podeAdicionar && <NovaAnotacaoConsultorForm />}

      {anotacoes.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-5 text-center text-sm text-foreground/60">
          Nenhuma anotação registrada ainda.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {anotacoes.map((anotacao) => (
            <div
              key={anotacao.id}
              className={`rounded-2xl border p-4 ${
                anotacao.resolvida ? "border-border bg-surface" : "border-accent/30 bg-accent-bg"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">{anotacao.texto}</p>
                <form action={marcarAnotacaoConsultorResolvida}>
                  <input type="hidden" name="id" value={anotacao.id} />
                  <input type="hidden" name="resolvida" value={(!anotacao.resolvida).toString()} />
                  <button
                    type="submit"
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      anotacao.resolvida
                        ? "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                        : "bg-good-bg text-good hover:bg-good/20"
                    }`}
                  >
                    {anotacao.resolvida ? "Reabrir" : "Marcar resolvida"}
                  </button>
                </form>
              </div>
              <p className="mt-2 text-xs text-foreground/50">
                {anotacao.autorNome} &middot; {formatarDataHora(anotacao.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
