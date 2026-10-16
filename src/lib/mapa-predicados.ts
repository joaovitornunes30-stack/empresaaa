import { prisma } from "@/lib/prisma";
import { limitesDoMes, mesAnterior, mesAtual } from "@/lib/financeiro";
import { buscarMesesPausados } from "@/lib/meses-pausados";
import { calcularMargemContribuicao, calcularCustoComAliquota } from "@/lib/calculos";
import { calcularVendasMes, calcularMetaDoMes } from "@/lib/analise";
import { calcularRetiradaSaudavel, calcularOQueRealmenteSobrouDoMes } from "@/lib/retiradas-calculo";
import { calcularCaixaLivre } from "@/lib/caixa-livre-calculo";
import { calcularRetiradaIdeal, type RetiradaIdealResultado } from "@/lib/caixa-livre";
import { calcularDiagnosticoRenda, type DiagnosticoRenda } from "@/lib/diagnostico-renda";
import { calcularSaidaEmNumeros, type SaidaEmNumerosResultado } from "@/lib/saida-em-numeros";
import { buscarSomaCustoDeVidaAtivo } from "@/lib/custo-de-vida";
import { identificarClientesDistantes } from "@/lib/clientes";

const SELECT_PLANOS_PARA_RESUMO = {
  itens: {
    select: {
      valorItem: true,
      quantidadeSessoes: true,
      produto: {
        select: {
          custoMedioMaterial: true,
          comissaoTipo: true,
          comissaoValor: true,
          perfilTributario: { select: { aliquota: true } },
        },
      },
      sessoes: { select: { status: true, dataEntregue: true } },
    },
  },
} as const;

type ClinicaParaMapa = {
  id: string;
  percentualReservaRetirada: number;
  proLaboreCombinado: number | null;
  horizonteDiasCompromissos: number;
  reservaMesesCustoFixo: number;
};

export type ProdutoDestaqueMargem = { nome: string; margemReais: number } | null;
export type PlanoDestaqueMargem = { nome: string; margemPorSessao: number } | null;

export type ContextoMapa = {
  temPerfil: boolean;
  temProduto: boolean;
  abriuMargem: boolean;
  temEntrada: boolean;
  temSaida: boolean;
  temDespesaFixa: boolean;
  metaDefinida: boolean;
  temCliente: boolean;
  temRetirada: boolean;
  temCustoDeVida: boolean;
  temMovEstoque: boolean;
  mesFechadoCompleto: boolean;
  sobraUltimoMesPositiva: boolean;
  sobra3MesesPositiva: boolean;
  sobraMediaUltimos3Meses: number | null;
  quantidadeProdutos: number;
  margemTodosPositiva: boolean;
  algumProdutoComMargemNaoPositiva: boolean;
  produtoMaiorMargem: ProdutoDestaqueMargem;
  produtoMenorMargem: ProdutoDestaqueMargem;
  caixaLivreOk: boolean;
  reservaFormada: boolean;
  reservaMinimaCalculada: boolean;
  temDividaNaoEstruturada: boolean;
  semDividaNaoEstruturada: boolean;
  retiradaIdealResultado: RetiradaIdealResultado;
  somaPreciso: number;
  somaQuero: number;
  quantidadeDonosAtivosCustoDeVida: number;
  diagnosticoRenda: DiagnosticoRenda;
  idealCobrePreciso: boolean;
  idealCobreQuero: boolean;
  saidaEmNumerosPreciso: SaidaEmNumerosResultado | null;
  metaMesBatidaAtual: boolean;
  metaMesBatidaAnterior: boolean;
  pacientesDistantesCount: number;
  planoMelhorMargemPorSessao: PlanoDestaqueMargem;
  nenhumProdutoComMovimentoZerado: boolean;
  movEstoqueMesAtual: boolean;
  movEstoqueMesAnterior: boolean;
};

/** O produto de maior (ou menor) margem unitária, entre os cadastrados. */
function destaquesDeMargem(
  produtos: { nome: string; margemReais: number }[],
): { maior: ProdutoDestaqueMargem; menor: ProdutoDestaqueMargem } {
  if (produtos.length === 0) return { maior: null, menor: null };
  const maior = produtos.reduce((a, b) => (b.margemReais > a.margemReais ? b : a));
  const menor = produtos.reduce((a, b) => (b.margemReais < a.margemReais ? b : a));
  return { maior: { nome: maior.nome, margemReais: maior.margemReais }, menor: { nome: menor.nome, margemReais: menor.margemReais } };
}

/** O item de modelo de plano com a maior margem por sessão, entre todos os modelos. */
function melhorMargemPorSessaoPlano(
  planoModelos: {
    nome: string;
    itens: { valorItem: number; produto: { custoMedioMaterial: number; comissaoTipo: "percentual" | "fixo"; comissaoValor: number; perfilTributario: { aliquota: number } } }[];
  }[],
): PlanoDestaqueMargem {
  let melhor: PlanoDestaqueMargem = null;
  for (const modelo of planoModelos) {
    for (const item of modelo.itens) {
      const custo = calcularCustoComAliquota(item.produto, item.valorItem, item.produto.perfilTributario.aliquota);
      const margemPorSessao = item.valorItem - custo;
      if (margemPorSessao > 0 && (!melhor || margemPorSessao > melhor.margemPorSessao)) {
        melhor = { nome: modelo.nome, margemPorSessao };
      }
    }
  }
  return melhor;
}

/**
 * Caminha para trás a partir do mês anterior ao atual, pulando meses
 * pausados — mesma regra de tresMesesFechadosNaoPausados, só que parando no
 * primeiro mês não-pausado em vez de acumular 3.
 */
function ultimoMesNaoPausado(hoje: Date, mesesPausados: Set<string>): string {
  let cursor = mesAnterior(mesAtual(hoje));
  for (let passos = 0; mesesPausados.has(cursor) && passos < 24; passos++) {
    cursor = mesAnterior(cursor);
  }
  return cursor;
}

/**
 * Reúne tudo que as estações do mapa precisam, em um único lugar — cada
 * predicado do item 3 da especificação corresponde a um campo aqui. Nenhuma
 * consulta nova além das já usadas pelo resto do app (Retiradas, Análise,
 * Clientes, Atenção) — só reorganizadas para o mapa.
 */
export async function calcularContextoMapa(
  clinica: ClinicaParaMapa,
  abriuMargemProduto: boolean,
  hoje: Date = new Date(),
): Promise<ContextoMapa> {
  const mesAtualStr = mesAtual(hoje);
  const mesAnteriorStr = mesAnterior(mesAtualStr);
  const limitesAtual = limitesDoMes(mesAtualStr);
  const limitesAnterior = limitesDoMes(mesAnteriorStr);

  const [
    perfis,
    produtosRaw,
    quantidadeEntradas,
    quantidadeSaidas,
    quantidadeFuncionarios,
    quantidadeDespesas,
    quantidadeDividas,
    metaAtualRow,
    metaAnteriorRow,
    quantidadeClientes,
    quantidadeRetiradas,
    estoqueMovimentos,
    mesesPausadosMap,
    caixaLivreResultado,
    somaCustoDeVida,
    clientesParaDistantes,
    entradasSaidasMesAtual,
    entradasSaidasMesAnterior,
    planoModelos,
    planosParaResumo,
  ] = await Promise.all([
    prisma.perfilTributario.count(),
    prisma.produto.findMany({
      select: {
        nome: true,
        precoVenda: true,
        custoMedioMaterial: true,
        duracaoMinutos: true,
        comissaoTipo: true,
        comissaoValor: true,
        perfilTributario: { select: { aliquota: true } },
      },
    }),
    prisma.entradaSaida.count({ where: { tipo: "entrada" } }),
    prisma.entradaSaida.count({ where: { tipo: "saida" } }),
    prisma.funcionario.count(),
    prisma.despesaAdministrativa.count(),
    prisma.divida.count(),
    prisma.metaDoMes.findFirst({ where: { mesReferencia: mesAtualStr } }),
    prisma.metaDoMes.findFirst({ where: { mesReferencia: mesAnteriorStr } }),
    prisma.cliente.count(),
    prisma.retirada.count(),
    prisma.estoqueMovimento.findMany({ select: { produtoId: true, tipo: true, quantidade: true, data: true } }),
    buscarMesesPausados(),
    calcularCaixaLivre(clinica.horizonteDiasCompromissos, clinica.reservaMesesCustoFixo, hoje),
    buscarSomaCustoDeVidaAtivo(clinica.id),
    prisma.cliente.findMany({
      select: { id: true, nome: true, observacoes: true, entradasSaida: { select: { valor: true, data: true, dataProximoRetorno: true } } },
    }),
    prisma.entradaSaida.findMany({ where: { data: { gte: limitesAtual.inicio, lt: limitesAtual.fim } }, select: { tipo: true, categoria: true, valor: true } }),
    prisma.entradaSaida.findMany({ where: { data: { gte: limitesAnterior.inicio, lt: limitesAnterior.fim } }, select: { tipo: true, categoria: true, valor: true } }),
    prisma.planoModelo.findMany({
      select: {
        nome: true,
        itens: {
          select: {
            valorItem: true,
            produto: { select: { custoMedioMaterial: true, comissaoTipo: true, comissaoValor: true, perfilTributario: { select: { aliquota: true } } } },
          },
        },
      },
    }),
    prisma.plano.findMany({ select: SELECT_PLANOS_PARA_RESUMO }),
  ]);

  const produtosComMargem = produtosRaw.map((p) => ({ nome: p.nome, ...calcularMargemContribuicao(p) }));
  const { maior: produtoMaiorMargem, menor: produtoMenorMargem } = destaquesDeMargem(produtosComMargem);
  const algumProdutoComMargemNaoPositiva = produtosComMargem.some((p) => p.margemReais <= 0);
  const margemTodosPositiva = produtosComMargem.length > 0 && produtosComMargem.every((p) => p.margemReais > 0);

  const mesesPausados = new Set(mesesPausadosMap.keys());
  const mesAlvo = ultimoMesNaoPausado(hoje, mesesPausados);
  const { inicio: inicioAlvo, fim: fimAlvo } = limitesDoMes(mesAlvo);
  const [entradasSaidasMesAlvo, sobraMesAlvo] = await Promise.all([
    prisma.entradaSaida.findMany({ where: { data: { gte: inicioAlvo, lt: fimAlvo } }, select: { tipo: true } }),
    calcularOQueRealmenteSobrouDoMes(mesAlvo, planosParaResumo),
  ]);
  const mesFechadoCompleto =
    entradasSaidasMesAlvo.some((e) => e.tipo === "entrada") && entradasSaidasMesAlvo.some((e) => e.tipo === "saida");
  const sobraUltimoMesPositiva = sobraMesAlvo.temDados && sobraMesAlvo.oQueRealmenteSobrou > 0;

  const estadoSaudavel = await calcularRetiradaSaudavel(clinica.percentualReservaRetirada, clinica.proLaboreCombinado, hoje);
  const sobra3MesesPositiva = estadoSaudavel.estado === "com_historico" && estadoSaudavel.sobraMedia > 0;

  const retiradaIdealResultado = calcularRetiradaIdeal(estadoSaudavel, caixaLivreResultado);
  const retiradaIdealTotal = retiradaIdealResultado.estado === "calculado" ? retiradaIdealResultado.retiradaIdeal : 0;
  const clinicaSaudavel = sobra3MesesPositiva && caixaLivreResultado.caixaLivre >= 0;
  const diagnosticoRenda = calcularDiagnosticoRenda(retiradaIdealTotal, somaCustoDeVida.somaPreciso, somaCustoDeVida.somaQuero, clinicaSaudavel);

  const idealCobrePreciso = diagnosticoRenda.tipo === "com_custo_de_vida" && diagnosticoRenda.faixa !== "abaixo_preciso";
  const idealCobreQuero = diagnosticoRenda.tipo === "com_custo_de_vida" && diagnosticoRenda.faixa === "acima_quero";

  const faltaPreciso = somaCustoDeVida.somaPreciso - retiradaIdealTotal;
  const saidaEmNumerosPreciso =
    faltaPreciso > 0 ? calcularSaidaEmNumeros(faltaPreciso, clinica.percentualReservaRetirada, produtosComMargem) : null;

  const vendasMesAtual = calcularVendasMes(entradasSaidasMesAtual);
  const vendasMesAnterior = calcularVendasMes(entradasSaidasMesAnterior);
  const metaMesBatidaAtual = !!metaAtualRow && calcularMetaDoMes(vendasMesAtual, metaAtualRow.valorMeta, hoje).atingiu;
  const metaMesBatidaAnterior = !!metaAnteriorRow && calcularMetaDoMes(vendasMesAnterior, metaAnteriorRow.valorMeta, hoje).atingiu;

  const clientesDistantes = identificarClientesDistantes(clientesParaDistantes);

  const saldoPorProduto = new Map<string, number>();
  for (const mov of estoqueMovimentos) {
    const atual = saldoPorProduto.get(mov.produtoId) ?? 0;
    saldoPorProduto.set(mov.produtoId, atual + (mov.tipo === "entrada" ? mov.quantidade : -mov.quantidade));
  }
  // saldoPorProduto.size === 0 (nenhum movimento registrado ainda) não conta
  // como "nada zerado" — .every() num array vazio é true por vacuidade, e
  // isso faria a estação aparecer concluída numa clínica sem nenhum dado.
  const nenhumProdutoComMovimentoZerado = saldoPorProduto.size > 0 && Array.from(saldoPorProduto.values()).every((saldo) => saldo > 0);
  const movEstoqueMesAtual = estoqueMovimentos.some((m) => m.data >= limitesAtual.inicio && m.data < limitesAtual.fim);
  const movEstoqueMesAnterior = estoqueMovimentos.some((m) => m.data >= limitesAnterior.inicio && m.data < limitesAnterior.fim);

  return {
    temPerfil: perfis > 0,
    temProduto: produtosRaw.length > 0,
    abriuMargem: abriuMargemProduto,
    temEntrada: quantidadeEntradas > 0,
    temSaida: quantidadeSaidas > 0,
    temDespesaFixa: quantidadeFuncionarios > 0 || quantidadeDespesas > 0 || quantidadeDividas > 0,
    metaDefinida: !!metaAtualRow,
    temCliente: quantidadeClientes > 0,
    temRetirada: quantidadeRetiradas > 0,
    temCustoDeVida: somaCustoDeVida.quantidadeDonosAtivos > 0,
    temMovEstoque: estoqueMovimentos.length > 0,
    mesFechadoCompleto,
    sobraUltimoMesPositiva,
    sobra3MesesPositiva,
    sobraMediaUltimos3Meses: estadoSaudavel.estado === "com_historico" ? estadoSaudavel.sobraMedia : null,
    quantidadeProdutos: produtosRaw.length,
    margemTodosPositiva,
    algumProdutoComMargemNaoPositiva,
    produtoMaiorMargem,
    produtoMenorMargem,
    caixaLivreOk: caixaLivreResultado.caixaLivre >= 0,
    // IMPORTANTE: NÃO usar caixaLivreResultado.reservaMinimaCalculada aqui —
    // esse flag só confere se existem 3 meses-calendário anteriores a hoje
    // (o que é sempre verdade, mesmo numa clínica criada ontem, sem
    // nenhum dado real). "3 meses fechados" de verdade é o que
    // calcularRetiradaSaudavel já define como estado "com_historico"
    // (precisa de ao menos 1 EntradaSaida real em cada um dos 3 meses) —
    // é essa checagem que usamos para decidir se a reserva é mensurável.
    // Sem isso, uma clínica nova (saldo R$ 0,00) marcava a bônus de reserva
    // como conquistada, porque 0 >= 0 e a "reserva mínima" caía em zero.
    reservaFormada:
      estadoSaudavel.estado === "com_historico" &&
      caixaLivreResultado.saldoAtual > 0 &&
      caixaLivreResultado.saldoAtual >= caixaLivreResultado.reservaMinima,
    reservaMinimaCalculada: estadoSaudavel.estado === "com_historico",
    temDividaNaoEstruturada: caixaLivreResultado.temDividaNaoEstruturada,
    semDividaNaoEstruturada: !caixaLivreResultado.temDividaNaoEstruturada,
    retiradaIdealResultado,
    somaPreciso: somaCustoDeVida.somaPreciso,
    somaQuero: somaCustoDeVida.somaQuero,
    quantidadeDonosAtivosCustoDeVida: somaCustoDeVida.quantidadeDonosAtivos,
    diagnosticoRenda,
    idealCobrePreciso,
    idealCobreQuero,
    saidaEmNumerosPreciso,
    metaMesBatidaAtual,
    metaMesBatidaAnterior,
    pacientesDistantesCount: clientesDistantes.length,
    planoMelhorMargemPorSessao: melhorMargemPorSessaoPlano(planoModelos),
    nenhumProdutoComMovimentoZerado,
    movEstoqueMesAtual,
    movEstoqueMesAnterior,
  };
}
