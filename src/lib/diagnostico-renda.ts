// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. A consulta ao banco (média financeira dos últimos 3 meses
// fechados) vive em lib/diagnostico-renda-calculo.ts, que só deve ser
// importado de Server Components/actions.

// Limites de "clínica saudável" — fáceis de ajustar aqui, num só lugar.
export const LIMITE_SOBRA_MEDIA_SAUDAVEL = 0;

export type PesoFinanceiro = "divida" | "custoFixo" | "margem";

export type MediaFinanceira3Meses = {
  sobraMedia: number;
  custosFixosMedia: number;
  parcelasDividaMedia: number;
  custoVendidoMedia: number;
  // null quando dívida, custo fixo e custo vendido estão todos zerados —
  // não há nada de fato pesando, então não aponta nenhum como "o maior".
  maiorPeso: PesoFinanceiro | null;
} | null;

export const PESO_LABEL: Record<PesoFinanceiro, string> = {
  divida: "o pagamento de dívidas",
  custoFixo: "o custo fixo",
  margem: "o custo do que é vendido (margem apertada)",
};

export type Faixa = "abaixo_preciso" | "entre_preciso_e_quero" | "acima_quero";
export type CausaAbaixoPreciso = "clinica_nao_saudavel" | "estrutura_insuficiente";

export type DiagnosticoRenda =
  | { tipo: "sem_custo_de_vida" }
  | { tipo: "com_custo_de_vida"; faixa: Faixa; causa: CausaAbaixoPreciso | null };

/**
 * Compara a Retirada ideal total com a soma do Preciso/Quero dos donos
 * que ativaram "Meu custo de vida". Quando a retirada ideal fica abaixo
 * do Preciso, separa a causa: clínica não saudável (sobra média <= 0 ou
 * caixa livre negativo) vs. clínica saudável mas renda necessária não
 * viável com a estrutura atual.
 */
export function calcularDiagnosticoRenda(
  retiradaIdealTotal: number,
  somaPreciso: number,
  somaQuero: number,
  clinicaSaudavel: boolean,
): DiagnosticoRenda {
  if (somaPreciso <= 0 && somaQuero <= 0) return { tipo: "sem_custo_de_vida" };

  if (retiradaIdealTotal < somaPreciso) {
    return {
      tipo: "com_custo_de_vida",
      faixa: "abaixo_preciso",
      causa: clinicaSaudavel ? "estrutura_insuficiente" : "clinica_nao_saudavel",
    };
  }
  if (retiradaIdealTotal <= somaQuero) {
    return { tipo: "com_custo_de_vida", faixa: "entre_preciso_e_quero", causa: null };
  }
  return { tipo: "com_custo_de_vida", faixa: "acima_quero", causa: null };
}
