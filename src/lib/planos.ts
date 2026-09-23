import { adicionarDias, limitesDoMes } from "@/lib/financeiro";
import { calcularCustoComBase, type ProdutoParaCusto } from "@/lib/calculos";

export const INTERVALOS_PLANO = [
  { label: "Semanal", dias: 7 },
  { label: "Quinzenal", dias: 14 },
  { label: "Mensal", dias: 30 },
  { label: "60 dias", dias: 60 },
] as const;

/** Status que ainda pedem uma decisão do usuário — não são terminais. */
export function sessaoEhAcionavel(status: string) {
  return status === "pendente" || status === "postergada";
}

export function calcularValorSessao(plano: { valorTotal: number; numeroSessoes: number }) {
  return plano.numeroSessoes > 0 ? plano.valorTotal / plano.numeroSessoes : 0;
}

/** Datas previstas para cada sessão: dataVenda + intervaloDias × (numero - 1). */
export function gerarDatasPrevistas(dataVenda: Date, numeroSessoes: number, intervaloDias: number) {
  return Array.from({ length: numeroSessoes }, (_, indice) =>
    adicionarDias(dataVenda, intervaloDias * indice),
  );
}

export type SessaoEntregueComPlano = {
  status: string;
  dataEntregue: Date | null;
  plano: {
    valorTotal: number;
    numeroSessoes: number;
  };
};

export type SessaoComPlano = SessaoEntregueComPlano & {
  plano: {
    valorTotal: number;
    numeroSessoes: number;
    produto: ProdutoParaCusto;
  };
};

/**
 * Receita reconhecida do mês = soma, para cada Sessao entregue com
 * dataEntregue no mês, de (Plano.valorTotal / Plano.numeroSessoes).
 * Diferente do Caixa do mês: não importa quando o dinheiro entrou, só
 * quando a sessão foi de fato entregue — uma antecipação não acelera
 * esse reconhecimento.
 */
export function calcularReceitaReconhecidaMes(sessoes: SessaoEntregueComPlano[], mes: string) {
  const { inicio, fim } = limitesDoMes(mes);
  return sessoes
    .filter(
      (s) =>
        s.status === "entregue" &&
        s.dataEntregue !== null &&
        s.dataEntregue.getTime() >= inicio.getTime() &&
        s.dataEntregue.getTime() < fim.getTime(),
    )
    .reduce((total, s) => total + calcularValorSessao(s.plano), 0);
}

/**
 * Custo do mês = soma, para cada Sessao entregue no mês, do custo do
 * Produto vinculado calculado proporcionalmente ao valor da sessão
 * (custoMedioMaterial + imposto + comissão sobre valorTotal/numeroSessoes).
 */
export function calcularCustoMes(sessoes: SessaoComPlano[], mes: string) {
  const { inicio, fim } = limitesDoMes(mes);
  return sessoes
    .filter(
      (s) =>
        s.status === "entregue" &&
        s.dataEntregue !== null &&
        s.dataEntregue.getTime() >= inicio.getTime() &&
        s.dataEntregue.getTime() < fim.getTime(),
    )
    .reduce((total, s) => {
      const valorSessao = calcularValorSessao(s.plano);
      return total + calcularCustoComBase(s.plano.produto, valorSessao);
    }, 0);
}

/** Sessões previstas para o mês que ainda não foram decididas (nem entregues, nem perdidas). */
export function calcularSessoesPendentesMes(
  sessoes: { dataPrevista: Date; status: string }[],
  mes: string,
) {
  const { inicio, fim } = limitesDoMes(mes);
  return sessoes.filter(
    (s) =>
      sessaoEhAcionavel(s.status) &&
      s.dataPrevista.getTime() >= inicio.getTime() &&
      s.dataPrevista.getTime() < fim.getTime(),
  ).length;
}

export type SessaoAgrupavel = { dataPrevista: Date };

/** Agrupa sessões por mês ("YYYY-MM") da dataPrevista, ordenado cronologicamente. */
export function agruparSessoesPorMes<T extends SessaoAgrupavel>(sessoes: T[]) {
  const grupos = new Map<string, T[]>();
  for (const sessao of sessoes) {
    const mes = `${sessao.dataPrevista.getFullYear()}-${String(sessao.dataPrevista.getMonth() + 1).padStart(2, "0")}`;
    const grupo = grupos.get(mes);
    if (grupo) grupo.push(sessao);
    else grupos.set(mes, [sessao]);
  }
  return Array.from(grupos.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, itens]) => ({ mes, itens }));
}
