import { prisma } from "@/lib/prisma";

/**
 * ÚNICO arquivo do app que consulta o modelo CustoDeVida. Regra rígida de
 * privacidade: cada dono só lê/escreve o PRÓPRIO registro — nenhuma função
 * aqui aceita um usuarioId arbitrário para leitura/escrita individual.
 * A única consulta que olha para mais de um dono (buscarSomaCustoDeVidaAtivo)
 * nunca retorna uma linha, só a soma agregada de quem ativou o interruptor.
 */

export type CustoDeVidaDados = {
  preciso: number | null;
  quero: number | null;
  moradia: number | null;
  gastosBasicos: number | null;
  cartao: number | null;
  outros: number | null;
  ativo: boolean;
};

const CAMPOS: Record<keyof CustoDeVidaDados, true> = {
  preciso: true,
  quero: true,
  moradia: true,
  gastosBasicos: true,
  cartao: true,
  outros: true,
  ativo: true,
};

/** O custo de vida do próprio chamador — nunca de outro usuário. */
export async function buscarMeuCustoDeVida(usuarioId: string): Promise<CustoDeVidaDados | null> {
  return prisma.custoDeVida.findUnique({ where: { usuarioId }, select: CAMPOS });
}

/** Salva o custo de vida do próprio chamador — nunca de outro usuário. */
export async function salvarMeuCustoDeVida(
  usuarioId: string,
  clinicaId: string,
  dados: CustoDeVidaDados,
): Promise<void> {
  await prisma.custoDeVida.upsert({
    where: { usuarioId },
    create: { usuarioId, clinicaId, ...dados },
    update: { ...dados },
  });
}

export type SomaCustoDeVida = {
  somaPreciso: number;
  somaQuero: number;
  quantidadeDonosAtivos: number;
};

/**
 * ÚNICA função que olha para o custo de vida de mais de um dono — mesmo
 * assim, nunca devolve uma linha, só os totais agregados de quem está com
 * ativo=true. Nunca chamar para um papel que não seja "dono" (consultor
 * não vê nem a soma).
 */
export async function buscarSomaCustoDeVidaAtivo(clinicaId: string): Promise<SomaCustoDeVida> {
  const resultado = await prisma.custoDeVida.aggregate({
    where: { clinicaId, ativo: true },
    _sum: { preciso: true, quero: true },
    _count: { _all: true },
  });
  return {
    somaPreciso: resultado._sum.preciso ?? 0,
    somaQuero: resultado._sum.quero ?? 0,
    quantidadeDonosAtivos: resultado._count._all,
  };
}
