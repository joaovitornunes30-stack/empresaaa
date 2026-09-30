import { prisma } from "@/lib/prisma";
import { runWithTenant, type TenantContext } from "@/lib/tenant-context";
import { adicionarMeses, agruparDividasPorPrazo, limitesDoMes, mesAtual } from "@/lib/financeiro";
import { calcularMetaDoMes, calcularVendasMes } from "@/lib/analise";
import { calcularSemaforoRetirada, calcularTotalRetiradoNoMes, type EstadoSemaforo } from "@/lib/retiradas";
import { calcularRetiradaSaudavel } from "@/lib/retiradas-calculo";

export type ResumoClinicaConsultor = {
  clinicaId: string;
  clinicaNome: string;
  semaforoRetirada: EstadoSemaforo;
  dividaCurtoPrazoSubiu: boolean;
  metaAbaixoDe50PorCentoPoucosDias: boolean;
  temAlerta: boolean;
  anotacoesNaoResolvidas: number;
};

/**
 * Resumo de uma clínica para a Central do Consultor — roda dentro do seu
 * próprio runWithTenant, escopado a essa clínica (não à sessão do
 * consultor, que não pertence a nenhuma clínica fixa), para que toda
 * consulta Prisma saia isolada corretamente mesmo consultando várias
 * clínicas na mesma requisição.
 */
export async function calcularResumoClinicaConsultor(
  sessaoConsultor: TenantContext,
  clinica: { id: string; nome: string },
): Promise<ResumoClinicaConsultor> {
  return runWithTenant({ ...sessaoConsultor, clinicaId: clinica.id, clinicaNome: clinica.nome }, async () => {
    const hoje = new Date();
    const mes = mesAtual(hoje);
    const mesPassado = adicionarMeses(hoje, -1);
    const { inicio, fim } = limitesDoMes(mes);

    const [retiradasDoMes, clinicaConfig, dividas, entradasSaidasDoMes, metaDoMes, anotacoesNaoResolvidas] =
      await Promise.all([
        prisma.retirada.findMany({ where: { data: { gte: inicio, lt: fim } }, select: { valor: true, data: true } }),
        prisma.clinica.findUniqueOrThrow({ where: { id: clinica.id } }),
        prisma.divida.findMany({ include: { entradasSaida: { include: { parcelas: true } } } }),
        prisma.entradaSaida.findMany({
          where: { data: { gte: inicio, lt: fim } },
          select: { tipo: true, categoria: true, valor: true },
        }),
        prisma.metaDoMes.findFirst({ where: { mesReferencia: mes } }),
        prisma.anotacaoConsultor.count({ where: { resolvida: false } }),
      ]);

    const estadoRetirada = await calcularRetiradaSaudavel(
      clinicaConfig.percentualReservaRetirada,
      clinicaConfig.proLaboreCombinado,
      hoje,
    );
    const totalRetiradoMes = calcularTotalRetiradoNoMes(retiradasDoMes, mes);
    const semaforoRetirada = calcularSemaforoRetirada(estadoRetirada, totalRetiradoMes);

    const dividaCurtoAtual = agruparDividasPorPrazo(dividas, hoje).curto;
    const dividaCurtoMesPassado = agruparDividasPorPrazo(dividas, mesPassado).curto;
    const dividaCurtoPrazoSubiu = dividaCurtoAtual > dividaCurtoMesPassado;

    const vendasMes = calcularVendasMes(entradasSaidasDoMes);
    const metaInfo = metaDoMes ? calcularMetaDoMes(vendasMes, metaDoMes.valorMeta, hoje) : null;
    const metaAbaixoDe50PorCentoPoucosDias = !!metaInfo && metaInfo.percentual < 50 && metaInfo.diasRestantes < 10;

    return {
      clinicaId: clinica.id,
      clinicaNome: clinica.nome,
      semaforoRetirada,
      dividaCurtoPrazoSubiu,
      metaAbaixoDe50PorCentoPoucosDias,
      temAlerta: dividaCurtoPrazoSubiu || metaAbaixoDe50PorCentoPoucosDias,
      anotacoesNaoResolvidas,
    };
  });
}
