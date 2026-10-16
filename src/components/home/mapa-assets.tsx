// Arte do "Seu Mapa" — mapa ilustrado de aventura, 100% SVG inline
// original (nenhuma imagem/arte de terceiros), isolado neste módulo para
// poder virar arte de ilustrador depois sem tocar na lógica das estações
// (lib/mapa.ts, lib/mapa-estacoes.ts) nem nas coordenadas (lib/mapa-layout.ts).
// Paleta: papel creme, terra em lilás, traços/destaque em roxo, contornos em
// tinta, água em creme escurecido com ondas lilás. Sem gradientes — a
// profundidade vem de sombra suave (feDropShadow) e sobreposição de tons.
// Laranja nunca aparece aqui (reservado a alerta, fora do mapa).
import type { MarcoEstacao, TamanhoEstacao } from "@/lib/mapa-tipos";
import { construirContornoTerra, construirRegioes, type PontoMapa } from "@/lib/mapa-layout";

export type EstadoVisualEstacao = "concluida" | "atual" | "futura" | "futura_bonus";

const TINTA = "#201A2B";
const ROXO = "#6D28D9";
const ROXO_ESCURO = "#4C1D95";
const TERRA_A = "#EFE9FC";
const TERRA_B = "#DDD0F7";
const AGUA = "#EAE5DD";
const PAPEL = "#F6F4F1";
const FUTURA_FILL = "#D8D2E0";
const FUTURA_STROKE = "#A79FC0";

// Desktop nos tamanhos pedidos na especificação (pequena ~64, média ~88,
// grande ~140); mobile proporcionalmente menor pro viewBox mais estreito.
export const TAMANHO_PX: Record<"desktop" | "mobile", Record<TamanhoEstacao, number>> = {
  desktop: { pequena: 64, media: 88, grande: 140, bonus: 100 },
  mobile: { pequena: 30, media: 40, grande: 64, bonus: 48 },
};

type CorEstado = { fill: string; stroke: string; opacity: number; tracejado: boolean };

const CORES: Record<EstadoVisualEstacao, CorEstado> = {
  concluida: { fill: ROXO, stroke: ROXO_ESCURO, opacity: 1, tracejado: false },
  atual: { fill: PAPEL, stroke: ROXO, opacity: 1, tracejado: false },
  futura: { fill: FUTURA_FILL, stroke: FUTURA_STROKE, opacity: 0.55, tracejado: false },
  futura_bonus: { fill: "none", stroke: FUTURA_STROKE, opacity: 0.7, tracejado: true },
};

export function estadoVisual(opcoes: { concluida: boolean; atual: boolean; tamanho: TamanhoEstacao }): EstadoVisualEstacao {
  if (opcoes.concluida) return "concluida";
  if (opcoes.atual) return "atual";
  if (opcoes.tamanho === "bonus") return "futura_bonus";
  return "futura";
}

/** Filtros compartilhados (sombra suave + textura de papel) — um único <defs>, referenciado por tudo. */
export function DefsDoMapa() {
  return (
    <defs>
      <filter id="mapa-sombra" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor={TINTA} floodOpacity="0.22" />
      </filter>
    </defs>
  );
}

function Onda({ x, y, largura }: { x: number; y: number; largura: number }) {
  return (
    <path
      d={`M ${x} ${y} q ${largura / 4} -6, ${largura / 2} 0 t ${largura / 2} 0`}
      fill="none"
      stroke={ROXO}
      strokeWidth={1.2}
      strokeLinecap="round"
      opacity={0.3}
    />
  );
}

function Montanha({ x, y, tamanho }: { x: number; y: number; tamanho: number }) {
  return (
    <g opacity={0.5}>
      <polygon points={`${x},${y} ${x + tamanho * 0.55},${y - tamanho} ${x + tamanho},${y}`} fill={TERRA_B} stroke={TINTA} strokeWidth={1} strokeLinejoin="round" />
      <polygon points={`${x + tamanho * 0.3},${y} ${x + tamanho * 0.75},${y - tamanho * 0.75} ${x + tamanho * 1.15},${y}`} fill={TERRA_A} stroke={TINTA} strokeWidth={1} strokeLinejoin="round" />
      <polygon points={`${x + tamanho * 0.5},${y - tamanho * 0.62} ${x + tamanho * 0.55},${y - tamanho} ${x + tamanho * 0.62},${y - tamanho * 0.62}`} fill="#ffffff" opacity={0.7} />
    </g>
  );
}

function Arvores({ x, y }: { x: number; y: number }) {
  return (
    <g opacity={0.55}>
      {[0, 14, 27].map((dx, i) => (
        <g key={i} transform={`translate(${x + dx} ${y - (i % 2) * 4})`}>
          <rect x={-1.5} y={0} width={3} height={8} fill={TINTA} opacity={0.4} />
          <circle cx={0} cy={-6} r={9} fill={TERRA_B} stroke={TINTA} strokeWidth={1} />
        </g>
      ))}
    </g>
  );
}

function Barco({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} opacity={0.6}>
      <path d="M -14 0 Q 0 8 14 0 L 10 4 L -10 4 Z" fill={ROXO} stroke={TINTA} strokeWidth={1} />
      <line x1={0} y1={0} x2={0} y2={-16} stroke={TINTA} strokeWidth={1.2} />
      <path d="M 0 -15 L 11 -3 L 0 -3 Z" fill="#ffffff" stroke={TINTA} strokeWidth={0.8} />
    </g>
  );
}

function RosaDosVentos({ x, y, raio }: { x: number; y: number; raio: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.5}>
      <circle r={raio} fill="none" stroke={ROXO} strokeWidth={1} />
      <circle r={raio * 0.6} fill="none" stroke={ROXO} strokeWidth={0.6} />
      {[0, 90, 180, 270].map((ang) => (
        <line key={ang} x1={0} y1={0} x2={raio * Math.cos((ang * Math.PI) / 180)} y2={raio * Math.sin((ang * Math.PI) / 180)} stroke={ROXO} strokeWidth={1} />
      ))}
      <polygon points={`0,${-raio} ${raio * 0.14},0 0,${raio * 0.3} ${-raio * 0.14},0`} fill={ROXO} />
      <text y={-raio - 6} textAnchor="middle" fontSize={10} fill={TINTA} fontWeight={700}>N</text>
    </g>
  );
}

function BarraDeEscala({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.6}>
      <line x1={0} y1={0} x2={60} y2={0} stroke={TINTA} strokeWidth={1.2} />
      <line x1={0} y1={-4} x2={0} y2={4} stroke={TINTA} strokeWidth={1.2} />
      <line x1={30} y1={-3} x2={30} y2={3} stroke={TINTA} strokeWidth={1} />
      <line x1={60} y1={-4} x2={60} y2={4} stroke={TINTA} strokeWidth={1.2} />
    </g>
  );
}

function FitaTitulo({ largura }: { largura: number }) {
  const cx = largura / 2;
  return (
    <g>
      <path d={`M ${cx - 95} 22 L ${cx + 95} 22 L ${cx + 108} 38 L ${cx + 95} 54 L ${cx - 95} 54 L ${cx - 108} 38 Z`} fill={ROXO} stroke={ROXO_ESCURO} strokeWidth={1.5} filter="url(#mapa-sombra)" />
      <text x={cx} y={43} textAnchor="middle" fontSize={17} fontWeight={700} fill="#ffffff" fontFamily="var(--font-display), sans-serif">
        Seu mapa
      </text>
    </g>
  );
}

function BordaDupla({ largura, altura }: { largura: number; altura: number }) {
  return (
    <g opacity={0.6}>
      <rect x={6} y={6} width={largura - 12} height={altura - 12} fill="none" stroke={ROXO} strokeWidth={2} rx={10} />
      <rect x={12} y={12} width={largura - 24} height={altura - 24} fill="none" stroke={ROXO} strokeWidth={0.75} rx={7} />
    </g>
  );
}

export function FundoMapa({
  largura,
  altura,
  pontos,
  vertical,
}: {
  largura: number;
  altura: number;
  pontos: PontoMapa[];
  vertical: boolean;
}) {
  const contornoTerra = construirContornoTerra(pontos, vertical);
  const regioes = construirRegioes(pontos);

  return (
    <g aria-hidden="true">
      <rect x={0} y={0} width={largura} height={altura} fill={AGUA} />
      {Array.from({ length: 10 }).map((_, i) => (
        <Onda key={i} x={(i * largura * 1.3) % largura} y={30 + ((i * 53) % (altura - 60))} largura={70} />
      ))}

      {contornoTerra && <path d={contornoTerra} fill={TERRA_A} stroke={TINTA} strokeWidth={1.5} strokeLinejoin="round" />}
      {regioes.map((r, i) => (
        <circle key={i} cx={r.cx} cy={r.cy} r={r.raio} fill={r.tom === "a" ? TERRA_A : TERRA_B} opacity={0.55} />
      ))}

      <Montanha x={largura * 0.08} y={altura * 0.2} tamanho={34} />
      <Montanha x={largura * (vertical ? 0.55 : 0.78)} y={altura * (vertical ? 0.12 : 0.18)} tamanho={26} />
      <Arvores x={largura * 0.14} y={altura * 0.78} />
      <Arvores x={largura * (vertical ? 0.68 : 0.9)} y={altura * (vertical ? 0.86 : 0.7)} />
      <Barco x={largura * 0.92} y={altura * (vertical ? 0.08 : 0.86)} escala={0.9} />
      <Barco x={largura * 0.06} y={altura * (vertical ? 0.94 : 0.12)} escala={0.7} />
      <RosaDosVentos x={largura - 48} y={altura - 46} raio={22} />
      <BarraDeEscala x={16} y={altura - 14} />
      <FitaTitulo largura={largura} />
      <BordaDupla largura={largura} altura={altura} />
    </g>
  );
}

function Nevoa({ raio, opacidade }: { raio: number; opacidade: number }) {
  if (opacidade <= 0) return null;
  return (
    <g opacity={opacidade}>
      <circle cx={-raio * 0.3} cy={-raio * 0.1} r={raio * 0.55} fill={PAPEL} />
      <circle cx={raio * 0.35} cy={raio * 0.05} r={raio * 0.5} fill={PAPEL} />
      <circle cx={0} cy={raio * 0.3} r={raio * 0.45} fill={PAPEL} />
    </g>
  );
}

function Bandeirinha({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={0} y2={-20} stroke={TINTA} strokeWidth={1.4} />
      <path d="M 0 -20 L 13 -15 L 0 -10 Z" fill={ROXO} stroke={ROXO_ESCURO} strokeWidth={0.8} />
    </g>
  );
}

function PinoAtual({ raio }: { raio: number }) {
  return (
    <g>
      <circle className="mapa-pulso-anel" r={raio * 1.25} fill="none" stroke={ROXO} strokeWidth={3} />
      <circle r={raio * 1.08} fill="none" stroke={ROXO} strokeWidth={2} opacity={0.5} />
      <g transform={`translate(0 ${-raio * 1.7})`}>
        <path d="M 0 -18 C -9 -18 -14 -11 -14 -4 C -14 6 0 18 0 18 C 0 18 14 6 14 -4 C 14 -11 9 -18 0 -18 Z" fill={ROXO} stroke={ROXO_ESCURO} strokeWidth={1.2} />
        <circle cy={-4} r={5} fill="#ffffff" />
      </g>
    </g>
  );
}

type PropsMarco = { tamanho: number; c: CorEstado };

function Casa({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  return (
    <g transform={`scale(${s})`}>
      <polygon points="50,12 88,44 12,44" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={22} y={44} width={56} height={40} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={40} y={60} width={20} height={24} fill={c.stroke} opacity={c.opacity * 0.5} />
      <rect x={28} y={52} width={10} height={10} fill="#ffffff" stroke={c.stroke} strokeWidth={1.4} opacity={c.opacity} />
      <rect x={62} y={52} width={10} height={10} fill="#ffffff" stroke={c.stroke} strokeWidth={1.4} opacity={c.opacity} />
      <rect x={66} y={16} width={8} height={16} fill={c.stroke} opacity={c.opacity * 0.8} />
    </g>
  );
}

function Banca({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  const listras = Array.from({ length: 5 }, (_, i) => (
    <rect key={i} x={14 + i * 14.4} y={18} width={14.4} height={16} fill={i % 2 === 0 ? c.fill : "#ffffff"} opacity={c.opacity} />
  ));
  return (
    <g transform={`scale(${s})`}>
      <clipPath id={`banca-clip-${tamanho}`}>
        <path d="M 16 34 L 50 16 L 84 34 Z" />
      </clipPath>
      <g clipPath={`url(#banca-clip-${tamanho})`}>{listras}</g>
      <path d="M 16 34 L 50 16 L 84 34 Z" fill="none" stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={26} y={48} width={10} height={32} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={64} y={48} width={10} height={32} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={20} y={34} width={60} height={12} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={38} y={70} width={10} height={12} fill={c.stroke} opacity={c.opacity * 0.6} />
      <rect x={54} y={70} width={10} height={12} fill={c.stroke} opacity={c.opacity * 0.6} />
    </g>
  );
}

function Balanca({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  return (
    <g transform={`scale(${s})`} fill="none" stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined}>
      <circle cx={50} cy={14} r={4} fill={c.fill} />
      <line x1={50} y1={18} x2={50} y2={82} />
      <line x1={20} y1={30} x2={80} y2={30} />
      <path d="M20 30 L10 52 A14 10 0 0 0 30 52 Z" fill={c.fill} />
      <path d="M80 30 L70 52 A14 10 0 0 0 90 52 Z" fill={c.fill} />
      <line x1={36} y1={82} x2={64} y2={82} />
      <polygon points="50,80 44,88 56,88" fill={c.fill} />
    </g>
  );
}

function Morro({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  function pilha(cx: number, cy: number) {
    return (
      <g>
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={cx} cy={cy - i * 4.5} rx={9} ry={4} fill={c.stroke} opacity={c.opacity * 0.55} stroke={c.stroke} strokeWidth={0.8} />
        ))}
        <ellipse cx={cx} cy={cy - 13.5} rx={9} ry={4} fill={c.fill} stroke={c.stroke} strokeWidth={1.2} opacity={c.opacity} />
      </g>
    );
  }
  return (
    <g transform={`scale(${s})`}>
      <path d="M 8 84 L 38 26 L 58 56 L 74 32 L 92 84 Z" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      {pilha(32, 80)}
      {pilha(54, 82)}
      {pilha(72, 78)}
    </g>
  );
}

function Ponte({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  return (
    <g transform={`scale(${s})`} opacity={c.opacity}>
      <path d="M 8 62 Q 50 20 92 62" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <path d="M 24 62 Q 32 46 40 62" fill="none" stroke={c.stroke} strokeWidth={2.2} />
      <path d="M 40 62 Q 50 40 60 62" fill="none" stroke={c.stroke} strokeWidth={2.2} />
      <path d="M 60 62 Q 68 46 76 62" fill="none" stroke={c.stroke} strokeWidth={2.2} />
      <line x1={8} y1={62} x2={92} y2={62} stroke={c.stroke} strokeWidth={3} />
      <line x1={8} y1={62} x2={8} y2={80} stroke={c.stroke} strokeWidth={3} />
      <line x1={92} y1={62} x2={92} y2={80} stroke={c.stroke} strokeWidth={3} />
      <line x1={8} y1={80} x2={92} y2={80} stroke={c.stroke} strokeWidth={3} />
    </g>
  );
}

function Castelo({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  function ameias(x: number, w: number, y: number) {
    const dentes = [];
    const n = Math.floor(w / 8);
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) dentes.push(<rect key={i} x={x + i * 8} y={y - 5} width={8} height={5} fill={c.fill} stroke={c.stroke} strokeWidth={1.4} opacity={c.opacity} />);
    }
    return dentes;
  }
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round">
      <rect x={14} y={52} width={72} height={38} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      {ameias(14, 72, 52)}
      <rect x={10} y={36} width={16} height={20} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      {ameias(10, 16, 36)}
      <rect x={74} y={36} width={16} height={20} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      {ameias(74, 16, 36)}
      <rect x={40} y={20} width={20} height={34} fill={c.fill} stroke={c.stroke} strokeWidth={3} opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} />
      {ameias(40, 20, 20)}
      <path d="M 44 70 Q 50 56 56 70 L 56 90 L 44 90 Z" fill={c.stroke} opacity={c.opacity * 0.55} />
      <path d="M 24 52 Q 24 42 30 40 Q 36 42 36 52 Z" fill={c.fill} stroke={c.stroke} strokeWidth={2} opacity={c.opacity} />
      <line x1={50} y1={10} x2={50} y2={20} stroke={c.stroke} strokeWidth={2} opacity={c.opacity} />
      <path d="M 50 10 L 62 15 L 50 18 Z" fill={ROXO} opacity={c.opacity} />
    </g>
  );
}

function Farol({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  return (
    <g transform={`scale(${s})`} opacity={c.opacity}>
      {c === CORES.concluida && <polygon points="50,38 10,92 90,92" fill="#ffffff" opacity={0.35} />}
      <polygon points="50,10 60,36 40,36" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <polygon points="41,36 59,36 66,86 34,86" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" strokeDasharray={c.tracejado ? "4 3" : undefined} />
      <rect x={38} y={46} width={24} height={10} fill={c.stroke} opacity={0.5} />
      <line x1={37} y1={64} x2={63} y2={64} stroke={c.stroke} strokeWidth={2.5} />
      <line x1={35} y1={76} x2={65} y2={76} stroke={c.stroke} strokeWidth={2.5} />
      <rect x={28} y={86} width={44} height={8} fill={c.fill} stroke={c.stroke} strokeWidth={2} />
    </g>
  );
}

function Placa({ tamanho, c }: PropsMarco) {
  const s = tamanho / 100;
  return (
    <g transform={`scale(${s})`}>
      <line x1={50} y1={40} x2={50} y2={90} stroke={c.stroke} strokeWidth={3} strokeDasharray="3 3" />
      <polygon points="16,16 80,16 72,40 16,40" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" strokeDasharray="4 3" opacity={c.opacity} />
    </g>
  );
}

const RENDERIZADORES: Record<MarcoEstacao, (p: PropsMarco) => React.ReactElement> = {
  casa: Casa,
  banca: Banca,
  balanca: Balanca,
  morro: Morro,
  ponte: Ponte,
  castelo: Castelo,
  farol: Farol,
  placa: Placa,
};

export function MarcoMapa({
  marco,
  tamanho,
  estado,
  viewport,
  nevoaOpacidade = 0,
}: {
  marco: MarcoEstacao;
  tamanho: TamanhoEstacao;
  estado: EstadoVisualEstacao;
  viewport: "desktop" | "mobile";
  nevoaOpacidade?: number;
}) {
  const Renderizador = RENDERIZADORES[marco];
  const px = TAMANHO_PX[viewport][tamanho];
  const c = CORES[estado];

  return (
    <g>
      {estado === "atual" && <PinoAtual raio={px * 0.32} />}
      <g transform={`translate(${-px / 2} ${-px / 2})`}>
        <Renderizador tamanho={px} c={c} />
      </g>
      {estado === "concluida" && <Bandeirinha x={px * 0.3} y={-px * 0.3} />}
      {(estado === "futura" || estado === "futura_bonus") && <Nevoa raio={px * 0.65} opacidade={nevoaOpacidade} />}
    </g>
  );
}

/** Selo de conquista (bônus) — SVG, sem emoji. */
export function SeloConquista({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" className="inline-block align-text-bottom">
      <circle cx={24} cy={20} r={15} fill={ROXO} stroke={ROXO_ESCURO} strokeWidth={2} />
      <path d="M 24 10 L 27 17 L 35 18 L 29 23 L 31 31 L 24 27 L 17 31 L 19 23 L 13 18 L 21 17 Z" fill="#ffffff" />
      <path d="M 16 32 L 12 44 L 20 40 L 24 46 L 28 40 L 36 44 L 32 32" fill="none" stroke={ROXO_ESCURO} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
