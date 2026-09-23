import { formatarMoeda } from "@/lib/financeiro";
import { agruparSessoesPorMes, calcularValorSessao } from "@/lib/planos";
import { SessaoRow } from "@/components/financeiro/sessao-row";

type Sessao = {
  id: string;
  numero: number;
  dataPrevista: Date;
  status: string;
  dataEntregue: Date | null;
};

type Plano = {
  id: string;
  valorTotal: number;
  numeroSessoes: number;
  cliente: { nome: string } | null;
  produto: { nome: string };
  sessoes: Sessao[];
};

function formatarMesLabel(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  return new Date(ano, mesNum - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (letra) => letra.toUpperCase());
}

export function PlanoCard({ plano }: { plano: Plano }) {
  const valorSessao = calcularValorSessao(plano);
  const grupos = agruparSessoesPorMes(plano.sessoes);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4">
        <p className="font-display text-base font-semibold text-foreground">
          {plano.produto.nome}
        </p>
        <p className="text-sm text-foreground/60">
          {plano.cliente?.nome ?? "Sem cliente"} · {plano.numeroSessoes}x{" "}
          {formatarMoeda(valorSessao)} · total {formatarMoeda(plano.valorTotal)}
        </p>
      </div>

      <div className="flex flex-col gap-5">
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
}
