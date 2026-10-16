import { prisma } from "@/lib/prisma";

/** mesISO ("AAAA-MM") -> motivo (ou null) de todo mês pausado da clínica atual. */
export async function buscarMesesPausados(): Promise<Map<string, string | null>> {
  const linhas = await prisma.mesPausado.findMany({ select: { mesISO: true, motivo: true } });
  return new Map(linhas.map((linha) => [linha.mesISO, linha.motivo]));
}
