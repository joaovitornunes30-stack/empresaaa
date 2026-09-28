"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { lerSessao, type ActionState } from "@/lib/auth";
import { comSessaoAba } from "@/lib/permissoes";
import { runWithTenant } from "@/lib/tenant-context";
import { limitesDoMes, mesAtual } from "@/lib/financeiro";
import {
  MOTIVOS_RETIRADA,
  calcularSemaforoRetirada,
  calcularTotalRetiradoNoMes,
} from "@/lib/retiradas";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";

export type { ActionState };

const AVISO_ACIMA_DO_RECOMENDADO =
  "Essa retirada deixou o mês acima do recomendado. Quer contar o que aconteceu? Isso ajuda a gente a entender e apoiar você.";

export type RetiradaState = { error: string | null; aviso: string | null };

const retiradaSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  data: z.coerce.date({ error: "Informe uma data válida." }),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  motivo: z.enum(MOTIVOS_RETIRADA).default("rotina"),
  observacao: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const criarRetirada = comSessaoAba<RetiradaState>("retiradas", async (ctx, _prevState, formData) => {
  const parsed = retiradaSchema.safeParse({
    valor: formData.get("valor"),
    data: formData.get("data"),
    descricao: formData.get("descricao") || undefined,
    motivo: formData.get("motivo") || undefined,
    observacao: formData.get("observacao") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", aviso: null };
  }

  const { valor, data, descricao, motivo, observacao } = parsed.data;

  await prisma.retirada.create({
    data: { valor, data, descricao, motivo, observacao, clinicaId: ctx.clinicaId },
  });

  revalidatePath("/retiradas");
  revalidatePath("/analise");

  // Aviso gentil e não-bloqueante — a retirada já foi salva; só avisa se
  // ela deixou o mês (o mês da retirada, não necessariamente o atual, para
  // lançamentos retroativos) acima do recomendado.
  const clinica = await prisma.clinica.findUniqueOrThrow({ where: { id: ctx.clinicaId } });
  const mesDaRetirada = mesAtual(data);
  const { inicio, fim } = limitesDoMes(mesDaRetirada);
  const retiradasDoMes = await prisma.retirada.findMany({
    where: { data: { gte: inicio, lt: fim } },
    select: { valor: true, data: true },
  });
  const totalRetiradoNoMes = calcularTotalRetiradoNoMes(retiradasDoMes, mesDaRetirada);
  const estado = await calcularRetiradaSaudavel(
    clinica.percentualReservaRetirada,
    clinica.proLaboreCombinado,
    data,
  );
  const semaforo = calcularSemaforoRetirada(estado, totalRetiradoNoMes);
  const aviso = semaforo === "laranja" || semaforo === "vermelho" ? AVISO_ACIMA_DO_RECOMENDADO : null;

  return { error: null, aviso };
});

const configuracaoRetiradaSchema = z.object({
  percentualReservaRetirada: z.coerce
    .number()
    .min(0, "Percentual deve estar entre 0 e 100.")
    .max(100, "Percentual deve estar entre 0 e 100."),
  proLaboreCombinado: z.coerce
    .number()
    .positive("Valor deve ser maior que zero.")
    .optional(),
});

/**
 * Dono e consultor podem ajustar a % de reserva e o pró-labore combinado
 * (o consultor tem papel ativo em definir essas referências junto da
 * clínica) — por isso não usa comSessao/comSessaoAba, que bloqueiam
 * incondicionalmente qualquer mutação de um consultor.
 */
export const atualizarConfiguracaoRetirada = async (
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  if (sessao.papel !== "dono" && sessao.papel !== "consultor") {
    return { error: "Você não tem permissão para esta ação." };
  }

  return runWithTenant(sessao, async () => {
    const parsed = configuracaoRetiradaSchema.safeParse({
      percentualReservaRetirada: formData.get("percentualReservaRetirada"),
      proLaboreCombinado: formData.get("proLaboreCombinado") || undefined,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }

    await prisma.clinica.update({
      where: { id: sessao.clinicaId },
      data: {
        percentualReservaRetirada: parsed.data.percentualReservaRetirada,
        proLaboreCombinado: parsed.data.proLaboreCombinado ?? null,
      },
    });

    revalidatePath("/retiradas");
    revalidatePath("/analise");
    return { error: null };
  });
};
