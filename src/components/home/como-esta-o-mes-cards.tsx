import Link from "next/link";
import { formatarMoeda } from "@/lib/financeiro";
import type { ComoEstaOMes } from "@/lib/como-esta-o-mes-calculo";

const SEMAFORO_DOT: Record<"verde" | "laranja" | "vermelho" | "cinza", string> = {
  verde: "bg-good",
  laranja: "bg-accent",
  vermelho: "bg-muted-red",
  cinza: "bg-foreground/25",
};

function Cartao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/50"
    >
      {children}
    </Link>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">{children}</p>;
}

export function ComoEstaOMesCards({
  dados,
  podeVerAnalise,
  podeVerFinanceiro,
  podeVerRetiradas,
}: {
  dados: ComoEstaOMes;
  podeVerAnalise: boolean;
  podeVerFinanceiro: boolean;
  podeVerRetiradas: boolean;
}) {
  if (!podeVerAnalise && !podeVerFinanceiro && !podeVerRetiradas) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-base font-semibold text-foreground">Como está o mês</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {podeVerAnalise && (
          <Cartao href="/analise">
            <Rotulo>Meta do mês</Rotulo>
            {dados.meta ? (
              <>
                <p className="mt-2 font-display text-xl font-bold text-foreground">
                  {formatarMoeda(dados.meta.vendasMes)}
                </p>
                <p className="text-xs text-foreground/50">de {formatarMoeda(dados.meta.valorMeta)}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className={`h-full rounded-full ${dados.meta.atingiu ? "bg-good" : "bg-primary"}`}
                    style={{ width: `${dados.meta.percentual}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold text-primary">Definir meta</p>
            )}
          </Cartao>
        )}

        {podeVerAnalise && (
          <Cartao href="/analise">
            <Rotulo>Receita reconhecida do mês</Rotulo>
            <p className="mt-2 font-display text-xl font-bold text-foreground">
              {formatarMoeda(dados.receitaReconhecidaMes)}
            </p>
          </Cartao>
        )}

        {podeVerFinanceiro && (
          <Cartao href="/financeiro">
            <Rotulo>Caixa do mês</Rotulo>
            <p className="mt-2 font-display text-xl font-bold text-foreground">{formatarMoeda(dados.caixaMes)}</p>
          </Cartao>
        )}

        {podeVerRetiradas && (
          <Cartao href="/retiradas">
            <Rotulo>Retirada ideal</Rotulo>
            {dados.retiradaIdeal.estado === "nao_retire_agora" ? (
              <p className="mt-2 font-display text-lg font-bold text-muted-red">Não retire agora</p>
            ) : (
              <p className="mt-2 font-display text-xl font-bold text-foreground">
                {formatarMoeda(dados.retiradaIdeal.estado === "calculado" ? dados.retiradaIdeal.retiradaIdeal : 0)}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${SEMAFORO_DOT[dados.semaforoIdeal]}`} />
              <span className="text-xs text-foreground/50">Total retirado: {formatarMoeda(dados.totalRetiradoMes)}</span>
            </div>
          </Cartao>
        )}
      </div>
    </section>
  );
}
