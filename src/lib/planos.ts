import { adicionarDias, limitesDoMes } from "@/lib/financeiro";
import { calcularCustoComAliquota, type ProdutoParaCustoComAliquota } from "@/lib/calculos";

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

export function calcularValorSessaoItem(item: { valorItem: number; quantidadeSessoes: number }) {
  return item.quantidadeSessoes > 0 ? item.valorItem / item.quantidadeSessoes : 0;
}

/** Datas previstas para cada sessão de um item: dataVenda + intervaloDias × (numero - 1). */
export function gerarDatasPrevistas(dataVenda: Date, quantidadeSessoes: number, intervaloDias: number) {
  return Array.from({ length: quantidadeSessoes }, (_, indice) =>
    adicionarDias(dataVenda, intervaloDias * indice),
  );
}

export type ItemComProdutoTributavel = {
  produto: { perfilTributario: { aliquota: number } };
};

/**
 * Cálculo de imposto conservador: quando um Plano mistura produtos de
 * perfis tributários diferentes, usa a MAIOR alíquota entre todos os itens
 * do plano para o imposto de TODAS as sessões dele, em vez de cada item usar
 * a alíquota do seu próprio produto — evita subestimar o custo tributário.
 */
export function calcularAliquotaMaximaPlano(plano: { itens: ItemComProdutoTributavel[] }) {
  return plano.itens.reduce((max, item) => Math.max(max, item.produto.perfilTributario.aliquota), 0);
}

export type PlanoItemParaResumo = {
  valorItem: number;
  quantidadeSessoes: number;
  produto: ProdutoParaCustoComAliquota;
  sessoes: { status: string; dataEntregue: Date | null }[];
};

export type PlanoParaResumo = {
  itens: (PlanoItemParaResumo & ItemComProdutoTributavel)[];
};

/**
 * Receita reconhecida do mês = soma, para cada Sessao entregue com
 * dataEntregue no mês, de (PlanoItem.valorItem / PlanoItem.quantidadeSessoes).
 * Diferente do Caixa do mês: não importa quando o dinheiro entrou, só
 * quando a sessão foi de fato entregue — uma antecipação não acelera esse
 * reconhecimento.
 */
export function calcularReceitaReconhecidaMes(planos: PlanoParaResumo[], mes: string) {
  const { inicio, fim } = limitesDoMes(mes);
  let total = 0;
  for (const plano of planos) {
    for (const item of plano.itens) {
      const valorSessao = calcularValorSessaoItem(item);
      for (const sessao of item.sessoes) {
        if (
          sessao.status === "entregue" &&
          sessao.dataEntregue !== null &&
          sessao.dataEntregue.getTime() >= inicio.getTime() &&
          sessao.dataEntregue.getTime() < fim.getTime()
        ) {
          total += valorSessao;
        }
      }
    }
  }
  return total;
}

/**
 * Custo do mês = soma, para cada Sessao entregue no mês, do custo do
 * Produto vinculado ao seu item (material + comissão) mais o imposto
 * calculado com a alíquota conservadora do plano (a maior entre os itens).
 */
export function calcularCustoMes(planos: PlanoParaResumo[], mes: string) {
  const { inicio, fim } = limitesDoMes(mes);
  let total = 0;
  for (const plano of planos) {
    const aliquotaMaxima = calcularAliquotaMaximaPlano(plano);
    for (const item of plano.itens) {
      const valorSessao = calcularValorSessaoItem(item);
      for (const sessao of item.sessoes) {
        if (
          sessao.status === "entregue" &&
          sessao.dataEntregue !== null &&
          sessao.dataEntregue.getTime() >= inicio.getTime() &&
          sessao.dataEntregue.getTime() < fim.getTime()
        ) {
          total += calcularCustoComAliquota(item.produto, valorSessao, aliquotaMaxima);
        }
      }
    }
  }
  return total;
}

export type PlanoParaPendentes = {
  itens: { sessoes: { dataPrevista: Date; status: string }[] }[];
};

/** Sessões previstas para o mês que ainda não foram decididas (nem entregues, nem perdidas). */
export function calcularSessoesPendentesMes(planos: PlanoParaPendentes[], mes: string) {
  const { inicio, fim } = limitesDoMes(mes);
  let total = 0;
  for (const plano of planos) {
    for (const item of plano.itens) {
      for (const sessao of item.sessoes) {
        if (
          sessaoEhAcionavel(sessao.status) &&
          sessao.dataPrevista.getTime() >= inicio.getTime() &&
          sessao.dataPrevista.getTime() < fim.getTime()
        ) {
          total++;
        }
      }
    }
  }
  return total;
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
