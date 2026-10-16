import { exigirSessaoPagina } from "@/lib/auth";
import { clinicasDoConsultor, trocarClinicaConsultor } from "@/app/(app)/conta-actions";
import { calcularResumoClinicaConsultor, type ResumoClinicaConsultor } from "@/lib/central-consultor";

export const dynamic = "force-dynamic";

const SEMAFORO_DOT: Record<ResumoClinicaConsultor["semaforoRetirada"], string> = {
  verde: "bg-good",
  laranja: "bg-accent",
  vermelho: "bg-muted-red",
  cinza: "bg-foreground/25",
};

export default async function CentralConsultorPage() {
  const sessao = await exigirSessaoPagina(["consultor"]);

  const clinicas = await clinicasDoConsultor();
  const resumos = await Promise.all(
    clinicas.map((clinica) => calcularResumoClinicaConsultor(sessao, clinica)),
  );

  const resumosOrdenados = [...resumos].sort((a, b) => {
    if (a.temAlerta !== b.temAlerta) return a.temAlerta ? -1 : 1;
    return a.clinicaNome.localeCompare(b.clinicaNome);
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Central do Consultor</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Suas clínicas, com um resumo rápido de onde vale a pena olhar primeiro.
        </p>
      </header>

      {resumosOrdenados.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground/60">
          Você ainda não tem acesso a nenhuma clínica.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {resumosOrdenados.map((resumo) => (
            <form key={resumo.clinicaId} action={trocarClinicaConsultor.bind(null, resumo.clinicaId)}>
              <button
                type="submit"
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 text-left transition-colors ${
                  resumo.temAlerta
                    ? "border-critical/30 bg-critical-bg hover:border-critical"
                    : "border-border bg-surface hover:border-primary"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEMAFORO_DOT[resumo.semaforoRetirada]}`} />
                  <span className="font-display text-base font-semibold text-foreground">
                    {resumo.clinicaNome}
                  </span>
                  {resumo.anotacoesNaoResolvidas > 0 && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
                      {resumo.anotacoesNaoResolvidas}{" "}
                      {resumo.anotacoesNaoResolvidas === 1 ? "anotação pendente" : "anotações pendentes"}
                    </span>
                  )}
                </div>

                {resumo.temAlerta && (
                  <div className="flex flex-col items-end gap-1 text-xs font-medium text-critical sm:flex-row sm:items-center sm:gap-3">
                    {resumo.dividaCurtoPrazoSubiu && <span>Dívida de curto prazo subiu no mês</span>}
                    {resumo.metaAbaixoDe50PorCentoPoucosDias && (
                      <span>Meta do mês abaixo de 50%, poucos dias restantes</span>
                    )}
                  </div>
                )}
              </button>
            </form>
          ))}
        </div>
      )}
    </main>
  );
}
