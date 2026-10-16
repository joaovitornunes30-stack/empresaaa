// Coordenadas e geometria do "Seu Mapa" — puro (sem React, sem Prisma),
// separado de propósito da arte (mapa-assets.tsx) e da lógica das estações
// (mapa.ts/mapa-estacoes.ts). Trocar a ilustração por arte de um
// ilustrador no futuro não deveria exigir mexer aqui; mudar o número ou a
// ordem das estações não deveria exigir mexer na arte.

export type PontoMapa = { x: number; y: number };

// O viewBox é "largo" de propósito (dá espaço de sobra pros ícones no
// tamanho pedido pela especificação, 140px no maior) — o container real
// (largura: 100% do card; altura: mínima fixa, sem aspect-ratio nenhum)
// quase nunca tem exatamente esta proporção. Por isso NINGUÉM posiciona
// nada por porcentagem direta do container: calcularRetanguloRenderizado()
// replica a mesma conta de "meet" do preserveAspectRatio do SVG, e todo o
// resto (ícones, rótulos) usa esse retângulo como referência — sem isso,
// qualquer descompasso de proporção criaria faixas vazias (letterbox) e
// jogaria os marcadores pra fora do desenho.
// Largura perto da largura real do card (~800px, max-w-4xl menos padding) —
// diferente da estratégia vertical do mobile: aqui queremos o eixo X
// "limitado pela altura" (sem perder escala por sobra de largura), então o
// viewBox fica justo, não esticado. Ver calcularRetanguloRenderizado.
export const VIEWBOX_DESKTOP = { largura: 780, altura: 460 };
// Estreito e bem mais alto que os 720 mínimos, de propósito: com as margens
// do topo/base fixas em unidades absolutas, um viewBox proporcionalmente
// mais alto (relativo à largura) aumenta o espaçamento real (em px) entre
// estações consecutivas quando ajustado ao container — ver
// calcularRetanguloRenderizado logo abaixo.
export const VIEWBOX_MOBILE = { largura: 300, altura: 1100 };

const MARGEM_DESKTOP = 50;
const AMPLITUDE_DESKTOP = 70;
// Mais pra baixo que o centro geométrico — sobra espaço em cima pra fita de
// título + o pino "Você está aqui" (que se estende acima do ícone), e
// embaixo pro rótulo + rosa dos ventos/escala.
const CENTRO_Y_DESKTOP = 230;

// Topo com mais folga que a base: precisa caber a fita de título E o pino
// "Você está aqui" (que se estende bem acima do ícone da estação atual).
const MARGEM_MOBILE_TOPO = 150;
const MARGEM_MOBILE_BASE = 90;
const AMPLITUDE_MOBILE = 46;
const CENTRO_X_MOBILE = 150;

/**
 * Replica a matemática de preserveAspectRatio="xMidYMid meet": dado o
 * tamanho real (em px) do container e o viewBox, devolve o retângulo (em
 * px, relativo ao container) onde a arte de fato é desenhada — e a escala
 * correspondente. Usar este retângulo (não o container inteiro) para
 * converter um ponto do viewBox em posição CSS é o que mantém ícone e
 * fundo sempre alinhados, qualquer que seja a largura real do cartão.
 */
export function calcularRetanguloRenderizado(
  containerPx: { largura: number; altura: number },
  viewBox: { largura: number; altura: number },
) {
  if (containerPx.largura <= 0 || containerPx.altura <= 0) {
    return { x: 0, y: 0, largura: containerPx.largura, altura: containerPx.altura, escala: 1 };
  }
  const escala = Math.min(containerPx.largura / viewBox.largura, containerPx.altura / viewBox.altura);
  const largura = viewBox.largura * escala;
  const altura = viewBox.altura * escala;
  return { x: (containerPx.largura - largura) / 2, y: (containerPx.altura - altura) / 2, largura, altura, escala };
}

/** Posição (em unidades do viewBox) de cada estação ao longo da trilha serpenteando. */
export function calcularPosicoes(n: number, vertical: boolean): PontoMapa[] {
  if (n === 0) return [];
  if (n === 1) {
    return vertical ? [{ x: CENTRO_X_MOBILE, y: VIEWBOX_MOBILE.altura / 2 }] : [{ x: VIEWBOX_DESKTOP.largura / 2, y: CENTRO_Y_DESKTOP }];
  }

  if (vertical) {
    const { altura } = VIEWBOX_MOBILE;
    const utilizavel = altura - MARGEM_MOBILE_TOPO - MARGEM_MOBILE_BASE;
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const y = MARGEM_MOBILE_TOPO + t * utilizavel;
      const x = CENTRO_X_MOBILE + AMPLITUDE_MOBILE * Math.sin(i * 1.35);
      return { x, y };
    });
  }

  const { largura } = VIEWBOX_DESKTOP;
  const utilizavel = largura - MARGEM_DESKTOP * 2;
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const x = MARGEM_DESKTOP + t * utilizavel;
    const y = CENTRO_Y_DESKTOP + AMPLITUDE_DESKTOP * Math.sin(i * 1.35);
    return { x, y };
  });
}

/** Caminho (SVG path d=) da trilha tracejada que liga as estações. */
export function construirCaminho(pontos: PontoMapa[]): string {
  return pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

/** Pseudo-aleatório determinístico (mesmo layout em todo render, sem variar no hidratar). */
function pseudoAleatorio(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Contorno orgânico de terra (SVG path fechado) que acompanha a trilha —
 * uma faixa de largura variável "abraçando" o caminho, como uma península
 * contínua em vez de ilhas separadas (mais robusto para qualquer
 * quantidade de estações, sem risco de auto-interseção).
 */
export function construirContornoTerra(pontos: PontoMapa[], vertical: boolean): string {
  if (pontos.length === 0) return "";
  if (pontos.length === 1) {
    const p = pontos[0];
    const r = vertical ? 140 : 160;
    return `M ${p.x - r} ${p.y} A ${r} ${r} 0 1 0 ${p.x + r} ${p.y} A ${r} ${r} 0 1 0 ${p.x - r} ${p.y} Z`;
  }

  const faixaBase = vertical ? 150 : 150;
  const superior: PontoMapa[] = [];
  const inferior: PontoMapa[] = [];

  for (let i = 0; i < pontos.length; i++) {
    const atual = pontos[i];
    const anterior = pontos[Math.max(0, i - 1)];
    const proximo = pontos[Math.min(pontos.length - 1, i + 1)];
    const dx = proximo.x - anterior.x;
    const dy = proximo.y - anterior.y;
    const comprimento = Math.hypot(dx, dy) || 1;
    // Perpendicular ao sentido do caminho.
    const nx = -dy / comprimento;
    const ny = dx / comprimento;
    const variacao = 1 + 0.22 * (pseudoAleatorio(i) - 0.5);
    const faixa = (faixaBase * variacao) / 2;
    superior.push({ x: atual.x + nx * faixa, y: atual.y + ny * faixa });
    inferior.push({ x: atual.x - nx * faixa, y: atual.y - ny * faixa });
  }

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const extensao = vertical ? 60 : 70;
  const dirInicial = { x: pontos[1].x - primeiro.x, y: pontos[1].y - primeiro.y };
  const compInicial = Math.hypot(dirInicial.x, dirInicial.y) || 1;
  const capInicial = { x: primeiro.x - (dirInicial.x / compInicial) * extensao, y: primeiro.y - (dirInicial.y / compInicial) * extensao };
  const dirFinal = { x: ultimo.x - pontos[pontos.length - 2].x, y: ultimo.y - pontos[pontos.length - 2].y };
  const compFinal = Math.hypot(dirFinal.x, dirFinal.y) || 1;
  const capFinal = { x: ultimo.x + (dirFinal.x / compFinal) * extensao, y: ultimo.y + (dirFinal.y / compFinal) * extensao };

  const caminhoSuperior = [capInicial, ...superior, capFinal].map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const caminhoInferior = [capFinal, ...inferior.slice().reverse(), capInicial].map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return `${caminhoSuperior} ${caminhoInferior} Z`;
}

export type RegiaoMapa = { cx: number; cy: number; raio: number; tom: "a" | "b" };

/** Blobs decorativos de terreno (tons alternados) ao longo do caminho, para sugerir regiões diferentes numa mesma massa de terra contínua. */
export function construirRegioes(pontos: PontoMapa[]): RegiaoMapa[] {
  const grupos = Math.min(5, Math.max(1, Math.ceil(pontos.length / 1.4)));
  const porGrupo = Math.ceil(pontos.length / grupos);
  const regioes: RegiaoMapa[] = [];
  for (let g = 0; g < grupos; g++) {
    const inicio = g * porGrupo;
    const fim = Math.min(pontos.length, inicio + porGrupo);
    const fatia = pontos.slice(inicio, fim);
    if (fatia.length === 0) continue;
    const cx = fatia.reduce((s, p) => s + p.x, 0) / fatia.length;
    const cy = fatia.reduce((s, p) => s + p.y, 0) / fatia.length;
    regioes.push({ cx, cy, raio: 95 + pseudoAleatorio(g) * 25, tom: g % 2 === 0 ? "a" : "b" });
  }
  return regioes;
}
