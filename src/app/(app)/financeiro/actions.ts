"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adicionarMeses, calcularValoresParcelas } from "@/lib/financeiro";
import { comSessao, comSessaoSimples, type ActionState } from "@/lib/auth";

export type { ActionState };

const entradaSaidaSchema = z
  .object({
    tipo: z.enum(["entrada", "saida"], { error: "Selecione o tipo." }),
    categoria: z.string().trim().min(1, "Informe a categoria."),
    valor: z.coerce.number().positive("Valor deve ser maior que zero."),
    data: z.coerce.date({ error: "Informe uma data válida." }),
    descricao: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    nomePrestador: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    produtoId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    quantidadeVendida: z.coerce
      .number()
      .int("Quantidade vendida deve ser um número inteiro.")
      .positive("Quantidade vendida deve ser maior que zero.")
      .optional(),
    clienteId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    fechadoPor: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    fechadoPorUsuarioId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    dataProximoRetorno: z.coerce
      .date({ error: "Informe uma data de retorno válida." })
      .optional(),
    parcelado: z.coerce.boolean().optional(),
    numeroParcelas: z.coerce.number().int().optional(),
  })
  .refine(
    (data) => !data.parcelado || (data.numeroParcelas ?? 0) >= 2,
    {
      message: "Informe ao menos 2 parcelas.",
      path: ["numeroParcelas"],
    },
  );

export const criarEntradaSaida = comSessao(["dono", "equipe"], async (ctx, _prevState, formData) => {
  const parsed = entradaSaidaSchema.safeParse({
    tipo: formData.get("tipo"),
    categoria: formData.get("categoria"),
    valor: formData.get("valor"),
    data: formData.get("data"),
    descricao: formData.get("descricao") || undefined,
    nomePrestador: formData.get("nomePrestador") || undefined,
    produtoId: formData.get("produtoId") || undefined,
    quantidadeVendida: formData.get("quantidadeVendida") || undefined,
    clienteId: formData.get("clienteId") || undefined,
    fechadoPor: formData.get("fechadoPor") || undefined,
    fechadoPorUsuarioId: formData.get("fechadoPorUsuarioId") || undefined,
    dataProximoRetorno: formData.get("dataProximoRetorno") || undefined,
    parcelado: formData.get("parcelado") === "on",
    numeroParcelas: formData.get("numeroParcelas") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const {
    tipo,
    categoria,
    valor,
    data,
    descricao,
    nomePrestador,
    produtoId,
    quantidadeVendida,
    clienteId,
    fechadoPor,
    fechadoPorUsuarioId,
    dataProximoRetorno,
    parcelado,
    numeroParcelas,
  } = parsed.data;

  // "equipe" pode registrar vendas (usado também na tela de Clientes), mas
  // não tem acesso a Financeiro — sem permissão para lançar saídas/despesas.
  if (ctx.papel === "equipe" && tipo !== "entrada") {
    return { error: "Você não tem permissão para registrar saídas." };
  }

  const produtoVendidoId = tipo === "entrada" ? produtoId : undefined;
  const clienteVendaId = tipo === "entrada" ? clienteId : undefined;

  // O select da UI só lista usuários da própria clínica, mas confirma aqui
  // também — fechadoPorUsuarioId vem de um campo de formulário comum.
  let fechadoPorUsuarioIdValido: string | undefined;
  if (tipo === "entrada" && fechadoPorUsuarioId) {
    const usuario = await prisma.usuario.findFirst({
      where: { id: fechadoPorUsuarioId, clinicaId: ctx.clinicaId },
      select: { id: true },
    });
    if (!usuario) return { error: "Usuário selecionado em 'Fechado por' inválido." };
    fechadoPorUsuarioIdValido = usuario.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.entradaSaida.create({
      data: {
        tipo,
        categoria,
        valor,
        data,
        descricao,
        nomePrestador: categoria === "Prestador de Serviço" ? nomePrestador : undefined,
        produtoId: produtoVendidoId,
        clienteId: clienteVendaId,
        fechadoPor: tipo === "entrada" ? fechadoPor : undefined,
        fechadoPorUsuarioId: fechadoPorUsuarioIdValido,
        dataProximoRetorno: tipo === "entrada" ? dataProximoRetorno : undefined,
        clinicaId: ctx.clinicaId,
        ...(parcelado && numeroParcelas
          ? {
              parcelas: {
                create: calcularValoresParcelas(valor, numeroParcelas).map(
                  (valorParcela, index) => ({
                    numeroParcela: index + 1,
                    valor: valorParcela,
                    dataVencimento: adicionarMeses(data, index),
                    status: "pendente",
                    clinicaId: ctx.clinicaId,
                  }),
                ),
              },
            }
          : {}),
      },
    });

    // Uma venda com produto e quantidade informados baixa o estoque
    // automaticamente — não deve ser lançada de novo na tela de Estoque.
    if (produtoVendidoId && quantidadeVendida) {
      const produtoVendido = await tx.produto.findUnique({
        where: { id: produtoVendidoId },
        select: { protocoloItens: { select: { materialId: true, quantidade: true } } },
      });

      if (produtoVendido && produtoVendido.protocoloItens.length > 0) {
        // Produto é um protocolo: a baixa de estoque reflete cada material
        // que o compõe, na quantidade definida no protocolo x quantidade
        // vendida. EstoqueMovimento.quantidade é inteiro, então o total é
        // arredondado (protocolos com quantidades fracionárias de material
        // ainda não têm rastreio de estoque em fração de unidade).
        await tx.estoqueMovimento.createMany({
          data: produtoVendido.protocoloItens.map((item) => ({
            produtoId: item.materialId,
            tipo: "saida",
            quantidade: Math.round(item.quantidade * quantidadeVendida),
            data,
            descricao: "Venda (protocolo)",
            clinicaId: ctx.clinicaId,
          })),
        });
      } else {
        await tx.estoqueMovimento.create({
          data: {
            produtoId: produtoVendidoId,
            tipo: "saida",
            quantidade: quantidadeVendida,
            data,
            descricao: "Venda",
            clinicaId: ctx.clinicaId,
          },
        });
      }
    }
  });

  revalidatePath("/financeiro");
  revalidatePath("/analise");
  revalidatePath("/clientes");
  return { error: null };
});

/**
 * Cada parcela mensal de uma dívida em pagamento vira o seu próprio
 * EntradaSaida (categoria "Dívida"), com valor igual ao valor da parcela
 * (nunca o total da dívida) e exatamente uma Parcela associada — assim ela
 * aparece na listagem apenas no mês do seu vencimento, com o valor certo.
 */
async function gerarParcelasMensaisDaDivida(
  dividaId: string,
  numeroParcelas: number,
  valorParcela: number,
  descricao: string | undefined,
  inicio: Date,
  clinicaId: string,
) {
  await prisma.$transaction(
    Array.from({ length: numeroParcelas }, (_, index) => {
      const dataVencimento = adicionarMeses(inicio, index);
      return prisma.entradaSaida.create({
        data: {
          tipo: "saida",
          categoria: "Dívida",
          valor: valorParcela,
          data: dataVencimento,
          descricao,
          dividaId,
          clinicaId,
          parcelas: {
            create: [
              {
                numeroParcela: index + 1,
                valor: valorParcela,
                dataVencimento,
                status: "pendente",
                clinicaId,
              },
            ],
          },
        },
      });
    }),
  );
}

const dividaSchema = z
  .object({
    valor: z.coerce.number().positive("Valor deve ser maior que zero."),
    dataVencimento: z.coerce.date({ error: "Informe uma data válida." }),
    numeroParcelas: z.coerce
      .number()
      .int()
      .positive("Número de parcelas deve ser maior que zero.")
      .optional(),
    valorParcela: z.coerce
      .number()
      .positive("Valor da parcela deve ser maior que zero.")
      .optional(),
    descricao: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    status: z.enum(["em_pagamento", "nao_estruturada"]).default("nao_estruturada"),
  })
  .refine((data) => data.status !== "em_pagamento" || !!data.numeroParcelas, {
    message: "Informe o número de parcelas.",
    path: ["numeroParcelas"],
  });

export const criarDivida = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = dividaSchema.safeParse({
    valor: formData.get("valor"),
    dataVencimento: formData.get("dataVencimento"),
    numeroParcelas: formData.get("numeroParcelas") || undefined,
    valorParcela: formData.get("valorParcela") || undefined,
    descricao: formData.get("descricao"),
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { valor, dataVencimento, numeroParcelas, valorParcela, descricao, status } =
    parsed.data;

  if (status === "em_pagamento" && numeroParcelas) {
    const valorCadaParcela =
      valorParcela ?? Math.round((valor / numeroParcelas) * 100) / 100;
    const hoje = new Date();

    const divida = await prisma.divida.create({
      data: {
        valor,
        dataVencimento,
        numeroParcelas,
        descricao,
        status,
        valorParcela: valorCadaParcela,
        clinicaId: ctx.clinicaId,
      },
    });

    await gerarParcelasMensaisDaDivida(
      divida.id,
      numeroParcelas,
      valorCadaParcela,
      descricao,
      hoje,
      ctx.clinicaId,
    );
  } else {
    await prisma.divida.create({
      data: { valor, dataVencimento, numeroParcelas, descricao, status, clinicaId: ctx.clinicaId },
    });
  }

  revalidatePath("/financeiro");
  return { error: null };
});

const ativarPagamentoSchema = z.object({
  id: z.string().trim().min(1),
  numeroParcelas: z.coerce
    .number()
    .int()
    .positive("Número de parcelas deve ser maior que zero."),
  valorParcela: z.coerce
    .number()
    .positive("Valor da parcela deve ser maior que zero.")
    .optional(),
});

export const ativarPagamentoDivida = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = ativarPagamentoSchema.safeParse({
    id: formData.get("id"),
    numeroParcelas: formData.get("numeroParcelas"),
    valorParcela: formData.get("valorParcela") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, numeroParcelas, valorParcela } = parsed.data;

  const divida = await prisma.divida.findUnique({ where: { id } });
  if (!divida) return { error: "Dívida não encontrada." };
  if (divida.status === "em_pagamento") return { error: null };

  const valorCadaParcela =
    valorParcela ?? Math.round((divida.valor / numeroParcelas) * 100) / 100;
  const hoje = new Date();

  await prisma.divida.update({
    where: { id },
    data: {
      status: "em_pagamento",
      numeroParcelas,
      valorParcela: valorCadaParcela,
    },
  });

  await gerarParcelasMensaisDaDivida(
    id,
    numeroParcelas,
    valorCadaParcela,
    divida.descricao ?? undefined,
    hoje,
    ctx.clinicaId,
  );

  revalidatePath("/financeiro");
  return { error: null };
});

const metaLucroSchema = z.object({
  mes: z.string().trim().regex(/^\d{4}-\d{2}$/, "Mês inválido."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
});

export const definirMetaLucro = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = metaLucroSchema.safeParse({
    mes: formData.get("mes"),
    valor: formData.get("valor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { mes, valor } = parsed.data;

  await prisma.metaLucroMensal.upsert({
    where: { clinicaId_mes: { clinicaId: ctx.clinicaId, mes } },
    create: { mes, valor, clinicaId: ctx.clinicaId },
    update: { valor },
  });

  revalidatePath("/financeiro");
  return { error: null };
});

export const marcarParcelaPaga = comSessaoSimples(["dono"], async (_ctx, formData) => {
  const id = z.string().trim().min(1).parse(formData.get("id"));

  await prisma.parcela.update({
    where: { id },
    data: { status: "pago" },
  });

  revalidatePath("/financeiro");
});

const funcionarioSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  tipoContrato: z.enum(["CLT", "PJ"], { error: "Selecione o tipo de contrato." }),
  valorMensal: z.coerce.number().positive("Valor mensal deve ser maior que zero."),
  usuarioId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

/**
 * Confirma que `usuarioId` pertence à própria clínica e ainda não está
 * vinculado a outro Funcionario (a coluna é @unique) — o select da UI já só
 * lista candidatos válidos, mas o formulário chega como campo comum.
 */
async function validarUsuarioParaFuncionario(
  usuarioId: string | undefined,
  clinicaId: string,
  funcionarioId?: string,
): Promise<{ ok: true; usuarioId: string | undefined } | { ok: false; error: string }> {
  if (!usuarioId) return { ok: true, usuarioId: undefined };

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, clinicaId },
    select: { id: true },
  });
  if (!usuario) return { ok: false, error: "Usuário selecionado inválido." };

  const vinculadoAOutro = await prisma.funcionario.findFirst({
    where: { usuarioId, ...(funcionarioId ? { id: { not: funcionarioId } } : {}) },
    select: { id: true },
  });
  if (vinculadoAOutro) {
    return { ok: false, error: "Este usuário já está vinculado a outro funcionário." };
  }

  return { ok: true, usuarioId: usuario.id };
}

export const criarFuncionario = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = funcionarioSchema.safeParse({
    nome: formData.get("nome"),
    tipoContrato: formData.get("tipoContrato"),
    valorMensal: formData.get("valorMensal"),
    usuarioId: formData.get("usuarioId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, tipoContrato, valorMensal, usuarioId } = parsed.data;

  const usuarioValidado = await validarUsuarioParaFuncionario(usuarioId, ctx.clinicaId);
  if (!usuarioValidado.ok) return { error: usuarioValidado.error };

  await prisma.funcionario.create({
    data: {
      nome,
      tipoContrato,
      valorMensal,
      usuarioId: usuarioValidado.usuarioId,
      clinicaId: ctx.clinicaId,
    },
  });

  revalidatePath("/financeiro");
  revalidatePath("/analise");
  return { error: null };
});

const editarFuncionarioSchema = funcionarioSchema.extend({
  id: z.string().trim().min(1),
});

export const editarFuncionario = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = editarFuncionarioSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    tipoContrato: formData.get("tipoContrato"),
    valorMensal: formData.get("valorMensal"),
    usuarioId: formData.get("usuarioId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { id, nome, tipoContrato, valorMensal, usuarioId } = parsed.data;

  const usuarioValidado = await validarUsuarioParaFuncionario(usuarioId, ctx.clinicaId, id);
  if (!usuarioValidado.ok) return { error: usuarioValidado.error };

  await prisma.funcionario.update({
    where: { id },
    data: {
      nome,
      tipoContrato,
      valorMensal,
      usuarioId: usuarioValidado.usuarioId ?? null,
    },
  });

  revalidatePath("/financeiro");
  revalidatePath("/analise");
  return { error: null };
});

export const alternarAtivoFuncionario = comSessaoSimples(["dono"], async (_ctx, formData) => {
  const id = z.string().trim().min(1).parse(formData.get("id"));

  const funcionario = await prisma.funcionario.findUnique({ where: { id }, select: { ativo: true } });
  if (!funcionario) return;

  await prisma.funcionario.update({ where: { id }, data: { ativo: !funcionario.ativo } });

  revalidatePath("/financeiro");
  revalidatePath("/analise");
});

const despesaAdministrativaSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome."),
    valor: z.coerce.number().positive("Valor deve ser maior que zero."),
    recorrente: z.coerce.boolean().optional(),
    frequencia: z.enum(["semanal", "quinzenal", "mensal", "60dias"]).optional(),
    dataInicio: z.coerce.date({ error: "Informe uma data de início válida." }).optional(),
    data: z.coerce.date({ error: "Informe uma data válida." }).optional(),
    status: z.enum(["pago", "pendente"]).default("pendente"),
  })
  .refine((d) => !d.recorrente || !!d.frequencia, {
    message: "Selecione a frequência.",
    path: ["frequencia"],
  })
  .refine((d) => !d.recorrente || !!d.dataInicio, {
    message: "Informe a data de início.",
    path: ["dataInicio"],
  })
  .refine((d) => d.recorrente || !!d.data, {
    message: "Informe a data.",
    path: ["data"],
  });

export const criarDespesaAdministrativa = comSessao(["dono"], async (ctx, _prevState, formData) => {
  const parsed = despesaAdministrativaSchema.safeParse({
    nome: formData.get("nome"),
    valor: formData.get("valor"),
    recorrente: formData.get("recorrente") === "on",
    frequencia: formData.get("frequencia") || undefined,
    dataInicio: formData.get("dataInicio") || undefined,
    data: formData.get("data") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, valor, recorrente, frequencia, dataInicio, data, status } = parsed.data;

  const despesa = await prisma.despesaAdministrativa.create({
    data: {
      nome,
      valor,
      recorrente: !!recorrente,
      frequencia: recorrente ? frequencia : undefined,
      dataInicio: recorrente ? dataInicio : undefined,
      data: recorrente ? undefined : data,
      status: recorrente ? "pendente" : status,
      clinicaId: ctx.clinicaId,
    },
  });

  // Avulsa: gera o único EntradaSaida já na criação, na data informada. A
  // recorrente é gerada sob demanda por sincronizarLancamentosRecorrentes
  // (lib/folha.ts), a cada intervalo a partir de dataInicio.
  if (!recorrente && data) {
    await prisma.entradaSaida.create({
      data: {
        tipo: "saida",
        categoria: "Despesa Administrativa",
        valor,
        data,
        descricao: nome,
        despesaAdministrativaId: despesa.id,
        clinicaId: ctx.clinicaId,
      },
    });
  }

  revalidatePath("/financeiro");
  revalidatePath("/analise");
  return { error: null };
});

export const alternarAtivoDespesaAdministrativa = comSessaoSimples(
  ["dono"],
  async (_ctx, formData) => {
    const id = z.string().trim().min(1).parse(formData.get("id"));

    const despesa = await prisma.despesaAdministrativa.findUnique({
      where: { id },
      select: { ativo: true },
    });
    if (!despesa) return;

    await prisma.despesaAdministrativa.update({ where: { id }, data: { ativo: !despesa.ativo } });

    revalidatePath("/financeiro");
    revalidatePath("/analise");
  },
);

export const marcarDespesaAdministrativaPaga = comSessaoSimples(
  ["dono"],
  async (_ctx, formData) => {
    const id = z.string().trim().min(1).parse(formData.get("id"));

    await prisma.despesaAdministrativa.update({ where: { id }, data: { status: "pago" } });

    revalidatePath("/financeiro");
    revalidatePath("/analise");
  },
);

const editarValorLancamentoGeradoSchema = z.object({
  id: z.string().trim().min(1),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
});

/**
 * Edita pontualmente o valor de um lançamento gerado automaticamente
 * (funcionarioId ou despesaAdministrativaId preenchido), sem alterar o
 * valorMensal/valor cadastrado na base — a edição vale só para aquela
 * ocorrência específica, e a sincronização nunca recria/sobrescreve um
 * lançamento já existente para o período.
 */
export const editarValorLancamentoGerado = comSessao(
  ["dono"],
  async (_ctx, _prevState, formData) => {
    const parsed = editarValorLancamentoGeradoSchema.safeParse({
      id: formData.get("id"),
      valor: formData.get("valor"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const { id, valor } = parsed.data;

    const lancamento = await prisma.entradaSaida.findFirst({
      where: { id, OR: [{ funcionarioId: { not: null } }, { despesaAdministrativaId: { not: null } }] },
      select: { id: true },
    });
    if (!lancamento) {
      return { error: "Lançamento não encontrado ou não é gerado automaticamente." };
    }

    await prisma.entradaSaida.update({ where: { id }, data: { valor } });

    revalidatePath("/financeiro");
    revalidatePath("/analise");
    return { error: null };
  },
);
