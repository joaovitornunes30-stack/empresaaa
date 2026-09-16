export type Prazo = "curto" | "medio" | "longo";

const DIA_MS = 24 * 60 * 60 * 1000;

function diasAte(data: Date, hoje: Date) {
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  return Math.round((inicioData.getTime() - inicioHoje.getTime()) / DIA_MS);
}

export function classificarPrazo(dataVencimento: Date, hoje: Date = new Date()): Prazo {
  const dias = diasAte(dataVencimento, hoje);
  if (dias <= 30) return "curto";
  if (dias <= 120) return "medio";
  return "longo";
}

export function agruparDividasPorPrazo(
  dividas: { valor: number; dataVencimento: Date }[],
  hoje: Date = new Date(),
) {
  const totais: Record<Prazo, number> = { curto: 0, medio: 0, longo: 0 };
  for (const divida of dividas) {
    const prazo = classificarPrazo(divida.dataVencimento, hoje);
    totais[prazo] += divida.valor;
  }
  return totais;
}

export function calcularSaldoAtual(
  entradasSaidas: { tipo: string; valor: number }[],
) {
  return entradasSaidas.reduce((saldo, item) => {
    return item.tipo === "entrada" ? saldo + item.valor : saldo - item.valor;
  }, 0);
}

export type ParcelaComTipo = {
  valor: number;
  dataVencimento: Date;
  status: string;
  entradaSaida: { tipo: string };
};

const HORIZONTES_PROJECAO = [30, 60, 90] as const;

export function calcularProjecaoCaixa(
  parcelas: ParcelaComTipo[],
  saldoAtual: number,
  hoje: Date = new Date(),
) {
  const pendentes = parcelas.filter((parcela) => parcela.status === "pendente");

  return HORIZONTES_PROJECAO.map((dias) => {
    const movimentoLiquido = pendentes.reduce((total, parcela) => {
      const diasParaVencer = diasAte(parcela.dataVencimento, hoje);
      if (diasParaVencer < 0 || diasParaVencer > dias) return total;
      const sinal = parcela.entradaSaida.tipo === "entrada" ? 1 : -1;
      return total + sinal * parcela.valor;
    }, 0);

    return {
      dias,
      movimentoLiquido,
      saldoProjetado: saldoAtual + movimentoLiquido,
    };
  });
}

export function parcelaVencida(
  parcela: { dataVencimento: Date; status: string },
  hoje: Date = new Date(),
) {
  return parcela.status === "pendente" && diasAte(parcela.dataVencimento, hoje) < 0;
}

export function adicionarMeses(data: Date, meses: number) {
  const resultado = new Date(data);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

export function calcularValoresParcelas(valorTotal: number, numeroParcelas: number) {
  const base = Math.floor((valorTotal / numeroParcelas) * 100) / 100;
  const valores = Array.from({ length: numeroParcelas }, () => base);
  const somaBase = base * numeroParcelas;
  const diferenca = Math.round((valorTotal - somaBase) * 100) / 100;
  valores[valores.length - 1] = Math.round((base + diferenca) * 100) / 100;
  return valores;
}

export const PRAZO_LABEL: Record<Prazo, string> = {
  curto: "Curto prazo (até 30 dias)",
  medio: "Médio prazo (31–120 dias)",
  longo: "Longo prazo (acima de 120 dias)",
};

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function mesAtual(hoje: Date = new Date()) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function limitesDoMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, mesNum - 1, 1));
  const fim = new Date(Date.UTC(ano, mesNum, 1));
  return { inicio, fim };
}
