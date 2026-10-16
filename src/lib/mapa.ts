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

  // Passo 1: todas as estações não-bônus (a meta, de tamanho "grande",
  // precisa estar resolvida ANTES de decidir a bônus — ver passo 2).
  const naoBonus: EstacaoMapa[] = definicoes
    .filter((def) => def.tamanho !== "bonus")
    .map((def) => {
      const concluidaAoVivo = def.subpassos.length > 0 && def.subpassos.every((s) => s.concluido);
      const persistida = porId.get(def.id) ?? null;
      if (!persistida && concluidaAoVivo && podeGravarConquistas) {
        novasConquistas.push({ estacaoId: def.id });
      }
      return { ...def, concluida: !!persistida || concluidaAoVivo, conquistadaEm: persistida ?? (concluidaAoVivo ? hoje : null) };
    });

  const metaConcluida = naoBonus.find((e) => e.tamanho === "grande")?.concluida ?? false;

  // Passo 2: a bônus — sempre ao vivo (nunca "trava" concluída, ver
  // calcularContextoMapa), e NUNCA antes da meta do mesmo objetivo, mesmo
  // que os subpassos dela isoladamente já estivessem satisfeitos.
  const bonus: EstacaoMapa[] = definicoes
    .filter((def) => def.tamanho === "bonus")
    .map((def) => {
      const subpassosOk = def.subpassos.length > 0 && def.subpassos.every((s) => s.concluido);
      const concluidaAoVivo = metaConcluida && subpassosOk;
      const persistida = porId.get(def.id) ?? null;
      if (concluidaAoVivo && !persistida && podeGravarConquistas) {
        novasConquistas.push({ estacaoId: def.id });
      }
      return { ...def, concluida: concluidaAoVivo, conquistadaEm: persistida };
    });

  const porOrdemOriginal = new Map(definicoes.map((d, i) => [d.id, i]));
  const estacoes = [...naoBonus, ...bonus].sort((a, b) => (porOrdemOriginal.get(a.id) ?? 0) - (porOrdemOriginal.get(b.id) ?? 0));

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
