import { prisma } from "@/lib/prisma";
import { diasAte, formatarMoeda, limitesDoMes, mesAtual } from "@/lib/financeiro";
import { calcularMetaDoMes, calcularVendasMes } from "@/lib/analise";
import { calcularMargemContribuicao } from "@/lib/calculos";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";
import { calcularCaixaLivre } from "@/lib/caixa-livre-calculo";
import { calcularRetiradaIdeal, calcularSemaforoRetiradaIdeal } from "@/lib/caixa-livre";
import { calcularTotalRetiradoNoMes } from "@/lib/retiradas";
import { identificarClientesDistantes } from "@/lib/clientes";
import { calcularSessoesPendentesMes, type PlanoParaPendentes } from "@/lib/planos";
import { lerModulosAtivos } from "@/lib/modulos";
import type { ItemAtencao } from "@/lib/atencao";

const HORIZONTE_VENCIMENTO_DIAS = 7;

/**
 * Lista de itens de atenção ATIVOS no momento, já na ORDEM DE PRIORIDADE
 * fixa pedida (Correção da Home, item 3) — o chamador aplica
 * ordenarItensAtencao de lib/atencao.ts por cima, com o objetivo da
 * clínica, e depois filtra por permissão (membro) antes de cortar em 5.
 * Reaproveita cálculos já existentes (Retirada ideal, meta do mês, margem
 * de contribuição, clientes distantes, sessões de plano) — nenhuma regra
 * nova é inventada aqui.
 */
export async function calcularItensAtencaoAtivos(
  clinica: {
    percentualReservaRetirada: number;
    proLaboreCombinado: number | null;
    horizonteDiasCompromissos: number;
    reservaMesesCustoFixo: number;
    modulosAtivos: unknown;
  },
  hoje: Date = new Date(),
): Promise<ItemAtencao[]> {
  const mes = mesAtual(hoje);
  const { inicio, fim } = limitesDoMes(mes);
  const modulosAtivos = lerModulosAtivos(clinica.modulosAtivos);

  const [
    parcelasPendentes,
    retiradasDoMes,
    produtos,
    metaDoMes,
    entradasSaidasDoMes,
    estoqueMovimentos,
    caixaLivreResultado,
    clientes,
    planosParaPendentes,
  ] = await Promise.all([
    prisma.parcela.findMany({ where: { status: "pendente" }, select: { valor: true, dataVencimento: true } }),
    prisma.retirada.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { valor: true, data: true } }),
    prisma.produto.findMany({
      select: {
        precoVenda: true,
        custoMedioMaterial: true,
        duracaoMinutos: true,
        comissaoTipo: true,
        comissaoValor: true,
        perfilTributario: { select: { aliquota: true } },
      },
    }),
    prisma.metaDoMes.findFirst({ where: { mesReferencia: mes } }),
    prisma.entradaSaida.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { tipo: true, categoria: true, valor: true } }),
    prisma.estoqueMovimento.findMany({ select: { produtoId: true, tipo: true, quantidade: true } }),
    calcularCaixaLivre(clinica.horizonteDiasCompromissos, clinica.reservaMesesCustoFixo, hoje),
    prisma.cliente.findMany({
      select: { id: true, nome: true, observacoes: true, entradasSaida: { select: { valor: true, data: true, dataProximoRetorno: true } } },
    }),
    modulosAtivos.planos
      ? prisma.plano.findMany({
          select: { itens: { select: { sessoes: { select: { dataPrevista: true, status: true } } } } },
        })
      : Promise.resolve([] as PlanoParaPendentes[]),
  ]);

  const itens: ItemAtencao[] = [];

  // ---------- 1/2 — Fixos, sempre no topo, nessa ordem ----------
  if (caixaLivreResultado.caixaLivre < 0) {
    itens.push({ id: "caixa_negativo", texto: "O caixa livre está negativo.", rota: "retiradas", fixo: true, objetivoRelacionado: null });
  }

  const parcelasNoHorizonte = parcelasPendentes.filter((p) => {
    const dias = diasAte(p.dataVencimento, hoje);
    return dias >= 0 && dias <= HORIZONTE_VENCIMENTO_DIAS;
  });
  if (parcelasNoHorizonte.length > 0) {
    const soma = parcelasNoHorizonte.reduce((total, p) => total + p.valor, 0);
    itens.push({
      id: "vencimentos_proximos",
      texto: `${parcelasNoHorizonte.length} ${parcelasNoHorizonte.length === 1 ? "parcela vencendo" : "parcelas vencendo"} nos próximos 7 dias, somando ${formatarMoeda(soma)}.`,
      rota: "financeiro",
      fixo: true,
      objetivoRelacionado: null,
    });
  }

  // ---------- 3 a 7 — ordem de prioridade fixa pedida ----------
  if (modulosAtivos.planos) {
    const sessoesPendentes = calcularSessoesPendentesMes(planosParaPendentes, mes);
    if (sessoesPendentes > 0) {
      itens.push({
        id: "sessoes_pendentes_planos",
        texto: `${sessoesPendentes} ${sessoesPendentes === 1 ? "sessão de plano pendente" : "sessões de plano pendentes"} este mês.`,
        rota: "clientes",
        fixo: false,
        objetivoRelacionado: null,
      });
    }
  }

  const distantes = identificarClientesDistantes(clientes);
  if (distantes.length > 0) {
    itens.push({
      id: "pacientes_distantes",
      texto: `${distantes.length} ${distantes.length === 1 ? "paciente distante" : "pacientes distantes"} esperando retorno.`,
      rota: "clientes",
      fixo: false,
      objetivoRelacionado: null,
    });
  }

  const saldoPorProduto = new Map<string, number>();
  estoqueMovimentos.forEach((mov) => {
    const atual = saldoPorProduto.get(mov.produtoId) ?? 0;
    saldoPorProduto.set(mov.produtoId, atual + (mov.tipo === "entrada" ? mov.quantidade : -mov.quantidade));
  });
  const temEstoqueZerado = Array.from(saldoPorProduto.values()).some((quantidade) => quantidade <= 0);
  if (temEstoqueZerado) {
    itens.push({
      id: "estoque_zerado",
      texto: "Algum produto está com o estoque zerado ou negativo.",
      rota: "produtos",
      fixo: false,
      objetivoRelacionado: "estoque",
    });
  }

  if (caixaLivreResultado.temDividaNaoEstruturada) {
    itens.push({
      id: "divida_nao_estruturada",
      texto: 'Há dívida sem parcelamento ("não estruturada") cadastrada.',
      rota: "financeiro",
      fixo: false,
      objetivoRelacionado: "caixa_contas",
    });
  }

  if (!metaDoMes) {
    itens.push({
      id: "meta_nao_definida",
      texto: "A meta do mês ainda não foi definida.",
      rota: "analise",
      fixo: false,
      objetivoRelacionado: null,
    });
  }

  // ---------- 8 a 10 — itens já existentes, sempre depois dos 7 acima ----------
  const estadoSaudavel = await calcularRetiradaSaudavel(clinica.percentualReservaRetirada, clinica.proLaboreCombinado, hoje);
  const resultadoIdeal = calcularRetiradaIdeal(estadoSaudavel, caixaLivreResultado);
  const totalRetiradoMes = calcularTotalRetiradoNoMes(retiradasDoMes, mes);
  const semaforoIdeal = calcularSemaforoRetiradaIdeal(resultadoIdeal, estadoSaudavel, totalRetiradoMes);
  if (semaforoIdeal === "vermelho" && totalRetiradoMes > 0) {
    itens.push({
      id: "retirada_acima_recomendado",
      texto: "A retirada deste mês está acima do recomendado.",
      rota: "retiradas",
      fixo: false,
      objetivoRelacionado: "quanto_retirar",
    });
  }

  if (produtos.length > 0 && produtos.every((produto) => calcularMargemContribuicao(produto).margemReais <= 0)) {
    itens.push({
      id: "nenhum_produto_com_margem",
      texto: "Nenhum produto cadastrado está com margem positiva.",
      rota: "produtos",
      fixo: false,
      objetivoRelacionado: "precificar",
    });
  }

  if (metaDoMes) {
    const vendasMes = calcularVendasMes(entradasSaidasDoMes);
    const metaInfo = calcularMetaDoMes(vendasMes, metaDoMes.valorMeta, hoje);
    if (metaInfo.percentual < 50 && metaInfo.diasRestantes < 10) {
      itens.push({
        id: "meta_abaixo_50_poucos_dias",
        texto: "Meta do mês abaixo de 50%, com poucos dias restantes.",
        rota: "analise",
        fixo: false,
        objetivoRelacionado: "vender_reter",
      });
    }
  }

  return itens;
}
