import { formatarMoeda } from "@/lib/financeiro";
import type { ObjetivoPrincipal } from "@/lib/checklist";
import type { ModulosAtivos } from "@/lib/modulos";
import type { ContextoMapa } from "@/lib/mapa-predicados";
import type { EstacaoMapa, MarcoEstacao, RotaMapa, SubpassoEstacao, TamanhoEstacao, TipoEstacao } from "@/lib/mapa-tipos";

type DefinicaoEstacao = Omit<EstacaoMapa, "concluida" | "conquistadaEm">;

// Marco visual (ver especificação, item 4) para as estações pequenas/médias
// — obrigatórias conforme seu papel (base, registrar/vender, margem/preço,
// sobra/caixa, dívida/contas). Castelo (meta=grande), farol (bônus) e placa
// (sugestão) são sempre automáticos, por tamanho/tipo — nunca precisam
// entrar aqui.
const MARCO_POR_ID: Record<string, MarcoEstacao> = {
  base_completa: "casa",
  base_perfil_produto: "casa",
  base_clientes: "casa",
  registrar_movimento_3: "banca",
  registrar_movimento_2: "banca",
  primeiras_vendas: "banca",
  registrar_vendas_mes_fechado: "banca",
  registrar_retiradas: "banca",
  primeiro_movimento_estoque: "banca",
  primeiro_mes_fechado: "banca",
  definir_meta_mes: "banca",
  trazer_contas_fixas: "ponte",
  estruturar_divida: "ponte",
  corrigir_preco: "balanca",
  ajustar_margem_todos_positiva: "balanca",
  nada_zerado: "balanca",
  sobra_ultimo_mes_positiva: "morro",
  caixa_livre_positivo: "morro",
  retirada_ideal_calculada: "morro",
  custo_de_vida_preenchido: "morro",
};

function marcoPara(id: string, tamanho: TamanhoEstacao, tipo: TipoEstacao): MarcoEstacao {
  if (tipo === "sugestao") return "placa";
  if (tamanho === "bonus") return "farol";
  if (tamanho === "grande") return "castelo";
  return MARCO_POR_ID[id] ?? "casa";
}

function montar(
  id: string,
  tamanho: TamanhoEstacao,
  tipo: TipoEstacao,
  titulo: string,
  porque: string,
  subpassos: SubpassoEstacao[],
  rota: RotaMapa,
  visivel: boolean,
  textoDinamico: string | null = null,
): DefinicaoEstacao {
  return { id, tamanho, tipo, marco: marcoPara(id, tamanho, tipo), titulo, porque, textoDinamico, subpassos, rota, visivel };
}

const SP = {
  perfil: (c: ContextoMapa): SubpassoEstacao => ({ label: "Cadastre um perfil tributário", concluido: c.temPerfil }),
  produto: (c: ContextoMapa): SubpassoEstacao => ({ label: "Cadastre um produto", concluido: c.temProduto }),
  margem: (c: ContextoMapa): SubpassoEstacao => ({ label: "Veja a margem de um produto", concluido: c.abriuMargem }),
  entrada: (c: ContextoMapa): SubpassoEstacao => ({ label: "Registre uma entrada", concluido: c.temEntrada }),
  saida: (c: ContextoMapa): SubpassoEstacao => ({ label: "Registre uma saída", concluido: c.temSaida }),
  despesaFixa: (c: ContextoMapa): SubpassoEstacao => ({
    label: "Cadastre uma despesa fixa (funcionário, despesa administrativa ou dívida)",
    concluido: c.temDespesaFixa,
  }),
  margemTodosPositiva: (c: ContextoMapa): SubpassoEstacao => ({ label: "Nenhum produto com margem zerada ou negativa", concluido: c.margemTodosPositiva }),
  mesFechado: (c: ContextoMapa): SubpassoEstacao => ({ label: "Tenha um mês fechado com entradas e saídas", concluido: c.mesFechadoCompleto }),
  sobraUltimoMes: (c: ContextoMapa): SubpassoEstacao => ({ label: "Sobra positiva no último mês fechado", concluido: c.sobraUltimoMesPositiva }),
  sobra3Meses: (c: ContextoMapa): SubpassoEstacao => ({ label: "Sobra média positiva nos últimos 3 meses fechados", concluido: c.sobra3MesesPositiva }),
  reservaFormada: (c: ContextoMapa): SubpassoEstacao => ({ label: "Reserva de segurança formada", concluido: c.reservaFormada }),
  caixaLivreOk: (c: ContextoMapa): SubpassoEstacao => ({ label: "Caixa livre positivo", concluido: c.caixaLivreOk }),
  semDividaNaoEstruturada: (c: ContextoMapa): SubpassoEstacao => ({ label: "Nenhuma dívida sem parcelamento", concluido: c.semDividaNaoEstruturada }),
  metaDefinida: (c: ContextoMapa): SubpassoEstacao => ({ label: "Defina a meta do mês", concluido: c.metaDefinida }),
  cliente: (c: ContextoMapa): SubpassoEstacao => ({ label: "Cadastre um cliente", concluido: c.temCliente }),
  retirada: (c: ContextoMapa): SubpassoEstacao => ({ label: "Registre uma retirada", concluido: c.temRetirada }),
  custoDeVida: (c: ContextoMapa): SubpassoEstacao => ({ label: 'Preencha "Meu custo de vida"', concluido: c.temCustoDeVida }),
  retiradaIdealCalculada: (c: ContextoMapa): SubpassoEstacao => ({
    label: "Retirada ideal calculada",
    concluido: c.retiradaIdealResultado.estado === "calculado",
  }),
  idealCobrePreciso: (c: ContextoMapa): SubpassoEstacao => ({ label: "Retirada ideal cobre o seu Preciso", concluido: c.idealCobrePreciso }),
  idealCobreQuero: (c: ContextoMapa): SubpassoEstacao => ({ label: "Retirada ideal cobre o seu Quero", concluido: c.idealCobreQuero }),
  movEstoque: (c: ContextoMapa): SubpassoEstacao => ({ label: "Registre um movimento de estoque", concluido: c.temMovEstoque }),
  nadaZerado: (c: ContextoMapa): SubpassoEstacao => ({ label: "Nenhum produto com saldo zerado", concluido: c.nenhumProdutoComMovimentoZerado }),
  estoque2Meses: (c: ContextoMapa): SubpassoEstacao => ({
    label: "Movimentos registrados em 2 meses seguidos",
    concluido: c.movEstoqueMesAtual && c.movEstoqueMesAnterior,
  }),
  metaMesBatida: (c: ContextoMapa): SubpassoEstacao => ({ label: "Meta do mês batida", concluido: c.metaMesBatidaAtual }),
  meta2MesesSeguidos: (c: ContextoMapa): SubpassoEstacao => ({
    label: "Meta batida em 2 meses seguidos",
    concluido: c.metaMesBatidaAtual && c.metaMesBatidaAnterior,
  }),
  produtosMinimo3: (c: ContextoMapa): SubpassoEstacao => ({ label: "Pelo menos 3 produtos cadastrados", concluido: c.quantidadeProdutos >= 3 }),
};

/** lucro_real — reaproveitado também por "outro" e "pular" (mesmo padrão da checklist antiga). */
function estacoesLucroReal(c: ContextoMapa): DefinicaoEstacao[] {
  return [
    montar(
      "base_completa",
      "pequena",
      "obrigatoria",
      "Monte a base",
      "Sem perfil tributário e produto cadastrados, nenhum cálculo de margem ou lucro é possível.",
      [SP.perfil(c), SP.produto(c), SP.margem(c)],
      "produtos",
      true,
    ),
    montar(
      "registrar_movimento_3",
      "pequena",
      "obrigatoria",
      "Registre o movimento",
      "O lucro real só aparece quando entradas, saídas e despesas fixas estão lançadas.",
      [SP.entrada(c), SP.saida(c), SP.despesaFixa(c)],
      "financeiro",
      true,
    ),
    montar(
      "corrigir_preco",
      "media",
      "obrigatoria",
      "Corrija o preço",
      "Um produto com margem zerada ou negativa corrói o lucro de todos os outros.",
      [SP.margemTodosPositiva(c)],
      "produtos",
      c.algumProdutoComMargemNaoPositiva,
    ),
    montar(
      "primeiro_mes_fechado",
      "media",
      "obrigatoria",
      "Feche seu primeiro mês",
      "Um mês fechado (com entradas e saídas) é a base de qualquer comparação futura.",
      [SP.mesFechado(c)],
      "financeiro",
      true,
    ),
    montar(
      "sobra_ultimo_mes_positiva",
      "media",
      "obrigatoria",
      "Descubra sua sobra",
      "Sobra é o que realmente fica depois de todos os custos — o número mais honesto de lucro.",
      [SP.sobraUltimoMes(c)],
      "analise",
      true,
    ),
    montar(
      "tres_meses_no_azul",
      "grande",
      "obrigatoria",
      "Três meses no azul",
      "Três meses seguidos de sobra positiva mostram que o lucro não foi sorte de um mês.",
      [SP.sobra3Meses(c)],
      "analise",
      true,
      c.sobraMediaUltimos3Meses !== null ? `Sua sobra média dos últimos 3 meses fechados é de ${formatarMoeda(c.sobraMediaUltimos3Meses)}.` : null,
    ),
    montar(
      "reserva_seguranca",
      "bonus",
      "obrigatoria",
      "Reserva de segurança",
      "Com caixa livre e reserva formados, a clínica está protegida mesmo em meses ruins.",
      [SP.reservaFormada(c), SP.caixaLivreOk(c)],
      "retiradas",
      true,
    ),
  ];
}

function estacoesCaixaContas(c: ContextoMapa): DefinicaoEstacao[] {
  const textoMeta = (() => {
    const caixa = c.retiradaIdealResultado.caixaLivre.caixaLivre;
    return `Seu caixa livre hoje é de ${formatarMoeda(caixa)}.`;
  })();

  return [
    montar(
      "registrar_movimento_2",
      "pequena",
      "obrigatoria",
      "Registre o movimento",
      "Organizar o caixa começa por ter entradas e saídas lançadas.",
      [SP.entrada(c), SP.saida(c)],
      "financeiro",
      true,
    ),
    montar(
      "trazer_contas_fixas",
      "pequena",
      "obrigatoria",
      "Traga as contas fixas",
      "Sem as contas fixas cadastradas, o caixa livre fica otimista demais.",
      [SP.despesaFixa(c)],
      "financeiro",
      true,
    ),
    montar(
      "estruturar_divida",
      "media",
      "obrigatoria",
      "Estruture sua dívida",
      "Uma dívida sem parcelamento não entra nas saídas programadas — o caixa livre pode estar enganando você.",
      [SP.semDividaNaoEstruturada(c)],
      "financeiro",
      c.temDividaNaoEstruturada,
    ),
    montar(
      "caixa_livre_positivo",
      "media",
      "obrigatoria",
      "Caixa livre positivo",
      "Caixa livre positivo é o sinal de que dá para olhar para retiradas com tranquilidade.",
      [SP.caixaLivreOk(c), SP.entrada(c), SP.saida(c)],
      "retiradas",
      true,
    ),
    montar(
      "caixa_sob_controle",
      "grande",
      "obrigatoria",
      "Caixa sob controle",
      "Caixa livre positivo, sem dívida solta e com um mês fechado: o caixa está sob controle de verdade.",
      [SP.caixaLivreOk(c), SP.semDividaNaoEstruturada(c), SP.mesFechado(c)],
      "analise",
      true,
      textoMeta,
    ),
    montar(
      "reserva_1_mes",
      "bonus",
      "obrigatoria",
      "Reserva de 1 mês de custo fixo",
      "Uma reserva formada é o que separa um mês ruim de uma crise.",
      [SP.reservaFormada(c)],
      "retiradas",
      true,
    ),
  ];
}

function estacoesPrecificar(c: ContextoMapa): DefinicaoEstacao[] {
  const comparar = (() => {
    if (c.quantidadeProdutos < 2 || !c.produtoMaiorMargem || !c.produtoMenorMargem) return null;
    return `Maior margem: ${c.produtoMaiorMargem.nome} (${formatarMoeda(c.produtoMaiorMargem.margemReais)}). Menor margem: ${c.produtoMenorMargem.nome} (${formatarMoeda(c.produtoMenorMargem.margemReais)}).`;
  })();

  const textoMeta = (() => {
    if (c.quantidadeProdutos === 0) return null;
    const comMargemPositiva = c.margemTodosPositiva ? c.quantidadeProdutos : c.quantidadeProdutos - (c.algumProdutoComMargemNaoPositiva ? 1 : 0);
    return `${comMargemPositiva} de ${c.quantidadeProdutos} produtos com margem positiva.`;
  })();

  return [
    montar(
      "base_completa",
      "pequena",
      "obrigatoria",
      "Monte a base",
      "Sem perfil tributário e produto cadastrados, não dá para calcular nenhuma margem.",
      [SP.perfil(c), SP.produto(c), SP.margem(c)],
      "produtos",
      true,
    ),
    montar(
      "ajustar_margem_todos_positiva",
      "media",
      "obrigatoria",
      "Ajuste o que não paga",
      "Um preço que não cobre o próprio custo é prejuízo disfarçado de venda.",
      [SP.margemTodosPositiva(c)],
      "produtos",
      true,
    ),
    montar(
      "definir_meta_mes",
      "pequena",
      "obrigatoria",
      "Defina a meta do mês",
      "Uma meta dá o alvo para saber se o preço está funcionando.",
      [SP.metaDefinida(c)],
      "analise",
      true,
    ),
    montar(
      "registrar_vendas_mes_fechado",
      "media",
      "obrigatoria",
      "Registre vendas",
      "Vendas registradas num mês fechado mostram o preço na prática, não só na teoria.",
      [SP.entrada(c), SP.mesFechado(c)],
      "financeiro",
      true,
    ),
    montar(
      "comparar_produtos",
      "pequena",
      "sugestao",
      "Compare seus produtos",
      "",
      [],
      "produtos",
      c.quantidadeProdutos >= 2,
      comparar,
    ),
    montar(
      "todos_produtos_pagando",
      "grande",
      "obrigatoria",
      "Todos os produtos pagando o seu custo",
      "Com pelo menos 3 produtos, todos com margem positiva e um mês fechado, a precificação está validada.",
      [SP.margemTodosPositiva(c), SP.produtosMinimo3(c), SP.mesFechado(c)],
      "produtos",
      true,
      textoMeta,
    ),
    montar(
      "meta_do_mes_batida",
      "bonus",
      "obrigatoria",
      "Meta do mês batida",
      "Bater a meta confirma que o preço certo também vende.",
      [SP.metaMesBatida(c)],
      "analise",
      true,
    ),
  ];
}

function estacoesQuantoRetirar(c: ContextoMapa): DefinicaoEstacao[] {
  const vejaQuantoFalta = (() => {
    if (!c.saidaEmNumerosPreciso) return null;
    if (c.saidaEmNumerosPreciso.tipo === "sem_produto_com_margem") return "Nenhum produto com margem positiva para calcular o quanto falta.";
    const r = c.saidaEmNumerosPreciso;
    return `Faltam ${formatarMoeda(r.faltaPorMes)}/mês — equivalente a ${r.quantidadeNecessaria}x ${r.produtoNome} (${formatarMoeda(r.faturamentoExtra)} de faturamento extra).`;
  })();

  const textoMeta = (() => {
    if (c.retiradaIdealResultado.estado !== "calculado") return null;
    if (c.somaPreciso <= 0) return null;
    return `Retirada ideal de ${formatarMoeda(c.retiradaIdealResultado.retiradaIdeal)} para cobrir seu Preciso de ${formatarMoeda(c.somaPreciso)}.`;
  })();

  const diagnosticoEstruturaInsuficiente =
    c.diagnosticoRenda.tipo === "com_custo_de_vida" && c.diagnosticoRenda.faixa === "abaixo_preciso" && c.diagnosticoRenda.causa === "estrutura_insuficiente";

  return [
    montar(
      "registrar_movimento_2",
      "pequena",
      "obrigatoria",
      "Registre o movimento",
      "Sem entradas e saídas lançadas, não há como saber quanto é saudável retirar.",
      [SP.entrada(c), SP.saida(c)],
      "financeiro",
      true,
    ),
    montar(
      "registrar_retiradas",
      "pequena",
      "obrigatoria",
      "Registre suas retiradas",
      "Registrar o que já foi retirado é o ponto de partida para saber se está dentro do saudável.",
      [SP.retirada(c)],
      "retiradas",
      true,
    ),
    montar(
      "custo_de_vida_preenchido",
      "pequena",
      "obrigatoria",
      "Diga quanto precisa",
      "Sem saber o seu Preciso e Quero, a retirada ideal não tem com o que ser comparada.",
      [SP.custoDeVida(c)],
      "retiradas",
      true,
    ),
    montar(
      "retirada_ideal_calculada",
      "media",
      "obrigatoria",
      "Descubra sua retirada ideal",
      "A retirada ideal cruza o que a clínica aguenta pagar com o que sobra de verdade no caixa.",
      [SP.retiradaIdealCalculada(c)],
      "retiradas",
      true,
    ),
    montar(
      "veja_quanto_falta",
      "pequena",
      "sugestao",
      "Veja quanto falta",
      "",
      [],
      "produtos",
      diagnosticoEstruturaInsuficiente,
      vejaQuantoFalta,
    ),
    montar(
      "cobrir_preciso",
      "grande",
      "obrigatoria",
      "Cobrir o seu Preciso",
      "Cobrir o Preciso é o primeiro nível de segurança financeira pessoal.",
      [SP.idealCobrePreciso(c)],
      "retiradas",
      true,
      textoMeta,
    ),
    montar(
      "cobrir_quero",
      "bonus",
      "obrigatoria",
      "Cobrir o seu Quero",
      "Cobrir o Quero é a renda que você escolheria, não só a que precisa.",
      [SP.idealCobreQuero(c)],
      "retiradas",
      true,
    ),
  ];
}

function estacoesVenderReter(c: ContextoMapa, modulosAtivos: ModulosAtivos): DefinicaoEstacao[] {
  const textoMeta = (() => {
    if (!c.produtoMaiorMargem) return null;
    return `Quanto vender do seu produto de maior margem (${c.produtoMaiorMargem.nome}) para bater a meta.`;
  })();

  const apostarNoMelhor = (() => {
    if (c.quantidadeProdutos < 2 || !c.produtoMaiorMargem) return null;
    let texto = `O produto ${c.produtoMaiorMargem.nome} tem a melhor margem; avalie vender mais dele.`;
    if (modulosAtivos.planos && c.planoMelhorMargemPorSessao && c.planoMelhorMargemPorSessao.margemPorSessao > c.produtoMaiorMargem.margemReais) {
      texto += ` O plano ${c.planoMelhorMargemPorSessao.nome} tem uma margem por sessão ainda maior.`;
    }
    return texto;
  })();

  const pacientesDistantes = c.pacientesDistantesCount > 0 ? `${c.pacientesDistantesCount} pacientes distantes` : null;

  return [
    montar(
      "base_completa",
      "pequena",
      "obrigatoria",
      "Monte a base",
      "Sem produto e perfil tributário cadastrados, não dá para medir o que realmente vale a pena vender mais.",
      [SP.perfil(c), SP.produto(c), SP.margem(c)],
      "produtos",
      true,
    ),
    montar(
      "primeiras_vendas",
      "pequena",
      "obrigatoria",
      "Registre as primeiras vendas",
      "As vendas são o ponto de partida para qualquer meta de vender mais.",
      [SP.entrada(c)],
      "financeiro",
      true,
    ),
    montar(
      "base_clientes",
      "pequena",
      "obrigatoria",
      "Cadastre sua base de clientes",
      "Reter pacientes exige antes saber quem são eles.",
      [SP.cliente(c)],
      "clientes",
      true,
    ),
    montar(
      "definir_meta_mes",
      "media",
      "obrigatoria",
      "Defina o alvo",
      "Um alvo claro orienta onde focar o esforço de vendas.",
      [SP.metaDefinida(c)],
      "analise",
      true,
      textoMeta,
    ),
    montar(
      "apostar_no_melhor",
      "pequena",
      "sugestao",
      "Aposte no melhor",
      "",
      [],
      "produtos",
      c.quantidadeProdutos >= 2,
      apostarNoMelhor,
    ),
    montar(
      "pacientes_distantes",
      "pequena",
      "sugestao",
      "Traga de volta quem sumiu",
      "",
      [],
      "clientes",
      c.pacientesDistantesCount > 0,
      pacientesDistantes,
    ),
    montar(
      "meta_do_mes_batida",
      "grande",
      "obrigatoria",
      "Bata a meta do mês",
      "Bater a meta confirma que vender mais e reter pacientes está funcionando junto.",
      [SP.metaMesBatida(c)],
      "analise",
      true,
    ),
    montar(
      "meta_2_meses_seguidos",
      "bonus",
      "obrigatoria",
      "Meta batida em 2 meses seguidos",
      "Dois meses seguidos mostram que o resultado não foi um lance isolado.",
      [SP.meta2MesesSeguidos(c)],
      "analise",
      true,
    ),
  ];
}

function estacoesEstoque(c: ContextoMapa): DefinicaoEstacao[] {
  const textoMeta = !c.temMovEstoque
    ? null
    : c.nenhumProdutoComMovimentoZerado
      ? "Nenhum dos produtos com movimento está zerado."
      : "Alguns produtos com movimento estão com saldo zerado.";

  return [
    montar(
      "base_perfil_produto",
      "pequena",
      "obrigatoria",
      "Monte a base",
      "Sem produto cadastrado, não há o que controlar no estoque.",
      [SP.perfil(c), SP.produto(c)],
      "produtos",
      true,
    ),
    montar(
      "primeiro_movimento_estoque",
      "pequena",
      "obrigatoria",
      "Registre o primeiro movimento de estoque",
      "Controlar estoque começa pelo primeiro movimento registrado.",
      [SP.movEstoque(c)],
      "produtos",
      true,
    ),
    montar(
      "primeiras_vendas",
      "pequena",
      "obrigatoria",
      "Registre suas vendas",
      "As vendas são o que de fato consome o estoque.",
      [SP.entrada(c)],
      "financeiro",
      true,
    ),
    montar(
      "nada_zerado",
      "media",
      "obrigatoria",
      "Nada zerado",
      "Um produto zerado é uma venda perdida por falta de aviso.",
      [SP.nadaZerado(c)],
      "produtos",
      true,
    ),
    montar(
      "estoque_em_dia",
      "grande",
      "obrigatoria",
      "Estoque em dia",
      "Dois meses seguidos de controle, sem nada zerado, é estoque em dia de verdade.",
      [SP.estoque2Meses(c), SP.nadaZerado(c)],
      "produtos",
      true,
      textoMeta,
    ),
    montar(
      "caixa_livre_ok_bonus",
      "bonus",
      "obrigatoria",
      "Caixa livre em dia",
      "Estoque sob controle libera atenção para cuidar do caixa também.",
      [SP.caixaLivreOk(c)],
      "retiradas",
      true,
    ),
  ];
}

/**
 * Monta a lista de estações do mapa para o objetivo escolhido — pura (sem
 * Prisma), consumindo só o ContextoMapa já calculado. "outro" e "pular"
 * reaproveitam exatamente as estações de "lucro_real" (mesma regra da
 * checklist antiga).
 */
export function definirEstacoes(objetivo: ObjetivoPrincipal, contexto: ContextoMapa, modulosAtivos: ModulosAtivos): DefinicaoEstacao[] {
  switch (objetivo) {
    case "lucro_real":
    case "outro":
    case "pular":
      return estacoesLucroReal(contexto);
    case "caixa_contas":
      return estacoesCaixaContas(contexto);
    case "precificar":
      return estacoesPrecificar(contexto);
    case "quanto_retirar":
      return estacoesQuantoRetirar(contexto);
    case "vender_reter":
      return estacoesVenderReter(contexto, modulosAtivos);
    case "estoque":
      return estacoesEstoque(contexto);
  }
}
