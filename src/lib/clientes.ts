const DIA_MS = 24 * 60 * 60 * 1000;

/** Limite de dias sem contato para um cliente entrar em "Pacientes Distantes". */
export const DIAS_LIMITE_DISTANTE = 60;

function diasDesde(data: Date, hoje: Date) {
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  return Math.round((inicioHoje.getTime() - inicioData.getTime()) / DIA_MS);
}

export type VendaResumo = {
  valor: number;
  data: Date;
  dataProximoRetorno: Date | null;
};

export function calcularUltimaVenda(vendas: { data: Date }[]): Date | null {
  if (vendas.length === 0) return null;
  return vendas.reduce(
    (maisRecente, item) => (item.data > maisRecente ? item.data : maisRecente),
    vendas[0].data,
  );
}

export function calcularValorTotalGasto(vendas: { valor: number }[]) {
  return vendas.reduce((total, item) => total + item.valor, 0);
}

/** A venda mais recente do cliente (a que define o retorno esperado atual). */
function obterVendaMaisRecente(vendas: VendaResumo[]): VendaResumo | null {
  if (vendas.length === 0) return null;
  return vendas.reduce((maisRecente, item) => (item.data > maisRecente.data ? item : maisRecente), vendas[0]);
}

export type ClienteComVendas = {
  id: string;
  nome: string;
  observacoes: string | null;
  entradasSaida: VendaResumo[];
};

export type ClienteDistante = {
  id: string;
  nome: string;
  dias: number;
  referencia: Date;
  observacoes: string | null;
};

/**
 * Clientes cuja referência de retorno (a dataProximoRetorno da venda mais
 * recente, ou a própria data dessa venda quando nenhum retorno foi
 * marcado) já passou há mais de DIAS_LIMITE_DISTANTE dias. Clientes sem
 * nenhuma venda ainda não entram na lista — não há referência para medir.
 * Ordenado do mais distante para o menos distante.
 */
export function identificarClientesDistantes(
  clientes: ClienteComVendas[],
  hoje: Date = new Date(),
): ClienteDistante[] {
  return clientes
    .map((cliente) => {
      const maisRecente = obterVendaMaisRecente(cliente.entradasSaida);
      if (!maisRecente) return null;
      const referencia = maisRecente.dataProximoRetorno ?? maisRecente.data;
      const dias = diasDesde(referencia, hoje);
      if (dias <= DIAS_LIMITE_DISTANTE) return null;
      return { id: cliente.id, nome: cliente.nome, dias, referencia, observacoes: cliente.observacoes };
    })
    .filter((item): item is ClienteDistante => item !== null)
    .sort((a, b) => b.dias - a.dias);
}

export type ClienteComContagem = { id: string; nome: string; totalIndicados: number };

/** Ranking de quem mais indicou outros clientes, só os que indicaram >0. */
export function rankearIndicacoes(clientes: ClienteComContagem[]): ClienteComContagem[] {
  return clientes
    .filter((cliente) => cliente.totalIndicados > 0)
    .sort((a, b) => b.totalIndicados - a.totalIndicados);
}
