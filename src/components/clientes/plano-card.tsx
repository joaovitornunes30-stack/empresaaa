import { formatarMoeda } from "@/lib/financeiro";
import { agruparSessoesPorMes, calcularValorSessaoItem } from "@/lib/planos";
import { SessaoRow } from "@/components/clientes/sessao-row";

type Sessao = {
  id: string;
  numero: number;
  dataPrevista: Date;
  status: string;
  dataEntregue: Date | null;
};

type PlanoItem = {
  id: string;
  valorItem: number;
  quantidadeSessoes: number;
  produto: { nome: string };
  sessoes: Sessao[];
};

type Plano = {
  id: string;
  nome: string;
  valorTotal: number;
  cliente: { nome: string } | null;
  itens: PlanoItem[];
};

function formatarMesLabel(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  return new Date(ano, mesNum - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (letra) => letra.toUpperCase());
}

function contarEntregues(sessoes: Sessao[]) {
  return sessoes.filter((s) => s.status === "entregue").length;
}

export function PlanoCard({ plano }: { plano: Plano }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4">
        <p className="font-display text-base font-semibold text-foreground">
          {plano.nome}
        </p>
        <p className="text-sm text-foreground/60">
          {plano.cliente?.nome ?? "Sem cliente"} · total {formatarMoeda(plano.valorTotal)}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {plano.itens.map((item) => {
          const valorSessao = calcularValorSessaoItem(item);
          const grupos = agruparSessoesPorMes(item.sessoes);
          return (
            <div key={item.id} className="rounded-xl border border-border/70 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                {item.produto.nome}{" "}
                <span className="font-normal text-foreground/50">
                  ({contarEntregues(item.sessoes)}/{item.quantidadeSessoes} sessões ·{" "}
                  {formatarMoeda(valorSessao)}/sessão)
                </span>
              </p>
              <div className="flex flex-col gap-4">
                {grupos.map((grupo) => (
                  <div key={grupo.mes}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                      {formatarMesLabel(grupo.mes)}
                    </p>
                    <div className="flex flex-col gap-2">
                      {grupo.itens.map((sessao) => (
                        <SessaoRow key={sessao.id} sessao={sessao} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
