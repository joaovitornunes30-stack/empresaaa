// Fundo e marcos (ícones) do "Seu Mapa", isolados num módulo próprio — só
// SVG inline, sem libs e sem nenhuma imagem externa. Pensado para poder ser
// trocado por arte de um ilustrador no futuro sem mexer na lógica das
// estações (lib/mapa-estacoes.ts só decide QUAL marco usar, nunca como ele
// é desenhado). Identidade visual: creme, roxo, laranja só em alerta, sem
// gradientes — textura só de linhas finas e contornos.
import type { MarcoEstacao, TamanhoEstacao } from "@/lib/mapa-tipos";

export type EstadoVisualEstacao = "concluida" | "atual" | "futura" | "futura_bonus";

const TAMANHO_PX: Record<TamanhoEstacao, number> = {
  pequena: 36,
  media: 52,
  grande: 84,
  bonus: 60,
};

const CORES: Record<EstadoVisualEstacao, { fill: string; stroke: string; opacity: number; tracejado: boolean }> = {
  concluida: { fill: "var(--color-primary)", stroke: "var(--color-primary-dark)", opacity: 1, tracejado: false },
  atual: { fill: "var(--color-background)", stroke: "var(--color-primary)", opacity: 1, tracejado: false },
  futura: { fill: "#cfc8da", stroke: "#a79fc0", opacity: 0.4, tracejado: false },
  futura_bonus: { fill: "none", stroke: "#a79fc0", opacity: 0.6, tracejado: true },
};

/** Textura de fundo: contornos finos estilo mapa antigo, sem gradiente. */
export function FundoMapa({ largura, altura }: { largura: number; altura: number }) {
  return (
    <g aria-hidden="true" opacity={0.5}>
      <rect x={0} y={0} width={largura} height={altura} fill="var(--background)" />
      {Array.from({ length: 6 }).map((_, i) => {
        const y = (altura / 7) * (i + 1);
        return (
          <path
            key={i}
            d={`M0 ${y} Q ${largura * 0.25} ${y - 18}, ${largura * 0.5} ${y} T ${largura} ${y}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
}

function Check({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const d = `M ${cx - r * 0.5} ${cy} L ${cx - r * 0.1} ${cy + r * 0.4} L ${cx + r * 0.55} ${cy - r * 0.45}`;
  return <path d={d} fill="none" stroke="#ffffff" strokeWidth={r * 0.28} strokeLinecap="round" strokeLinejoin="round" />;
}

function Base({ tamanho, children }: { tamanho: number; children: React.ReactNode }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-hidden="true">
      {children}
    </svg>
  );
}

function Casa({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined}>
        <polygon points="50,15 85,45 15,45" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" />
        <rect x={25} y={45} width={50} height={38} fill={c.fill} stroke={c.stroke} strokeWidth={3} />
        <rect x={42} y={60} width={16} height={23} fill={c.stroke} opacity={0.5} />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={60} r={16} />}
    </Base>
  );
}

function Banca({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined}>
        <rect x={20} y={35} width={60} height={14} fill={c.fill} stroke={c.stroke} strokeWidth={3} />
        <rect x={28} y={49} width={10} height={32} fill={c.fill} stroke={c.stroke} strokeWidth={3} />
        <rect x={62} y={49} width={10} height={32} fill={c.fill} stroke={c.stroke} strokeWidth={3} />
        <path d="M18 35 L50 18 L82 35" fill="none" stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={42} r={14} />}
    </Base>
  );
}

function Balanca({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} fill="none" stroke={c.stroke} strokeWidth={3}>
        <line x1={50} y1={18} x2={50} y2={78} />
        <line x1={22} y1={32} x2={78} y2={32} />
        <path d="M22 32 L12 52 A14 10 0 0 0 32 52 Z" fill={c.fill} />
        <path d="M78 32 L68 52 A14 10 0 0 0 88 52 Z" fill={c.fill} />
        <line x1={38} y1={78} x2={62} y2={78} />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={48} r={14} />}
    </Base>
  );
}

function Morro({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined}>
        <path d="M10 80 L40 30 L58 55 L72 35 L92 80 Z" fill={c.fill} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round" />
        <circle cx={40} cy={64} r={7} fill={c.stroke} opacity={0.5} />
        <circle cx={58} cy={68} r={7} fill={c.stroke} opacity={0.5} />
        <circle cx={70} cy={60} r={7} fill={c.stroke} opacity={0.5} />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={62} r={14} />}
    </Base>
  );
}

function Ponte({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} fill="none" stroke={c.stroke} strokeWidth={3}>
        <path d="M10 65 Q50 25 90 65" fill={c.fill} />
        <line x1={22} y1={65} x2={22} y2={82} />
        <line x1={40} y1={65} x2={40} y2={82} />
        <line x1={60} y1={65} x2={60} y2={82} />
        <line x1={78} y1={65} x2={78} y2={82} />
        <line x1={10} y1={82} x2={90} y2={82} />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={55} r={14} />}
    </Base>
  );
}

function Castelo({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round">
        <rect x={18} y={48} width={64} height={38} fill={c.fill} />
        <rect x={14} y={38} width={14} height={14} fill={c.fill} />
        <rect x={43} y={30} width={14} height={22} fill={c.fill} />
        <rect x={72} y={38} width={14} height={14} fill={c.fill} />
        <polygon points="50,14 58,30 42,30" fill={c.fill} />
        <rect x={44} y={66} width={12} height={20} fill={c.stroke} opacity={0.5} stroke="none" />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={60} r={18} />}
    </Base>
  );
}

function Farol({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g opacity={c.opacity} strokeDasharray={c.tracejado ? "4 3" : undefined} stroke={c.stroke} strokeWidth={3} strokeLinejoin="round">
        <polygon points="50,12 60,38 40,38" fill={c.fill} />
        <polygon points="42,38 58,38 64,80 36,80" fill={c.fill} />
        <line x1={38} y1={54} x2={62} y2={54} />
        <line x1={36} y1={68} x2={64} y2={68} />
        <path d="M66 30 L80 20 M34 30 L20 20" strokeLinecap="round" />
        <rect x={30} y={80} width={40} height={8} fill={c.fill} />
      </g>
      {c === CORES.concluida && <Check cx={50} cy={58} r={14} />}
    </Base>
  );
}

function Placa({ tamanho, c }: { tamanho: number; c: (typeof CORES)[EstadoVisualEstacao] }) {
  return (
    <Base tamanho={tamanho}>
      <g stroke={c.stroke} strokeWidth={3} fill={c.fill} opacity={c.opacity}>
        <line x1={50} y1={45} x2={50} y2={86} strokeDasharray="3 3" />
        <polygon points="18,20 78,20 70,42 18,42" strokeDasharray="4 3" strokeLinejoin="round" />
      </g>
    </Base>
  );
}

const RENDERIZADORES: Record<MarcoEstacao, typeof Casa> = {
  casa: Casa,
  banca: Banca,
  balanca: Balanca,
  morro: Morro,
  ponte: Ponte,
  castelo: Castelo,
  farol: Farol,
  placa: Placa,
};

export function estadoVisual(opcoes: { concluida: boolean; atual: boolean; tamanho: TamanhoEstacao }): EstadoVisualEstacao {
  if (opcoes.concluida) return "concluida";
  if (opcoes.atual) return "atual";
  if (opcoes.tamanho === "bonus") return "futura_bonus";
  return "futura";
}

export function MarcoMapa({
  marco,
  tamanho,
  estado,
}: {
  marco: MarcoEstacao;
  tamanho: TamanhoEstacao;
  estado: EstadoVisualEstacao;
}) {
  const Renderizador = RENDERIZADORES[marco];
  const px = TAMANHO_PX[tamanho];
  return <Renderizador tamanho={px} c={CORES[estado]} />;
}
