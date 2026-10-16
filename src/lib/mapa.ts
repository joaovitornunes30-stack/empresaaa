import { prisma } from "@/lib/prisma";
import type { ObjetivoPrincipal } from "@/lib/checklist";
import type { ModulosAtivos } from "@/lib/modulos";
import { calcularContextoMapa } from "@/lib/mapa-predicados";
import { definirEstacoes } from "@/lib/mapa-estacoes";
import type { EstacaoMapa, EstadoMapa } from "@/lib/mapa-tipos";

type ClinicaParaMapa = {
  id: string;
  percentualReservaRetirada: number;
  proLaboreCombinado: number | null;
  horizonteDiasCompromissos: number;
  reservaMesesCustoFixo: number;
  abriuMargemProduto: boolean;
};

/**
 * Calcula o estado completo do "Seu Mapa" para a clínica — estações visíveis
 * (condicionais/sugestões já filtradas pelos dados atuais), conquistas
 * persistidas mescladas com o cálculo ao vivo, estação atual e progresso.
 *
 * `podeGravarConquistas`: só true quando quem está vendo é o dono (o
 * consultor vê o mesmo mapa em leitura, sem disparar a gravação de novas
 * conquistas — ver Home/page.tsx).
 */
export async function calcularEstadoMapa(
  clinica: ClinicaParaMapa,
  objetivoPrincipal: ObjetivoPrincipal | null,
  modulosAtivos: ModulosAtivos,
  podeGravarConquistas: boolean,
  hoje: Date = new Date(),
): Promise<EstadoMapa> {
  const contexto = await calcularContextoMapa(clinica, clinica.abriuMargemProduto, hoje);
  const definicoes = definirEstacoes(objetivoPrincipal ?? "pular", contexto, modulosAtivos).filter((d) => d.visivel);

  const conquistadas = await prisma.mapaEstacaoConquistada.findMany({
    where: { estacaoId: { in: definicoes.map((d) => d.id) } },
    select: { estacaoId: true, conquistadaEm: true },
  });
  const porId = new Map(conquistadas.map((c) => [c.estacaoId, c.conquistadaEm]));

  const novasConquistas: { estacaoId: string }[] = [];
  const estacoes: EstacaoMapa[] = definicoes.map((def) => {
    const concluidaAoVivo = def.subpassos.length > 0 && def.subpassos.every((s) => s.concluido);
    const persistida = porId.get(def.id) ?? null;

    if (def.tamanho === "bonus") {
      // Ao vivo sempre — mas grava a data da primeira conquista só para o selo.
      if (concluidaAoVivo && !persistida && podeGravarConquistas) {
        novasConquistas.push({ estacaoId: def.id });
      }
      return { ...def, concluida: concluidaAoVivo, conquistadaEm: persistida };
    }

    if (!persistida && concluidaAoVivo && podeGravarConquistas) {
      novasConquistas.push({ estacaoId: def.id });
    }
    return { ...def, concluida: !!persistida || concluidaAoVivo, conquistadaEm: persistida ?? (concluidaAoVivo ? hoje : null) };
  });

  if (novasConquistas.length > 0) {
    await prisma.mapaEstacaoConquistada.createMany({
      data: novasConquistas.map((n) => ({ estacaoId: n.estacaoId, clinicaId: clinica.id })),
      skipDuplicates: true,
    });
  }

  const obrigatoriasCore = estacoes.filter((e) => e.tipo === "obrigatoria" && e.tamanho !== "bonus");
  const atual = obrigatoriasCore.find((e) => !e.concluida) ?? null;
  const todasObrigatoriasConcluidas = atual === null;
  const estacaoAtualIndice = atual ? obrigatoriasCore.indexOf(atual) + 1 : obrigatoriasCore.length;

  return {
    estacoes,
    estacaoAtualIndice,
    totalObrigatoriasVisiveis: obrigatoriasCore.length,
    estacaoAtualId: atual?.id ?? null,
    todasObrigatoriasConcluidas,
  };
}
