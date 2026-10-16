import type { Papel } from "@/lib/tenant-context";

// Sem dependências Node-only — importado tanto por middleware.ts (Edge)
// quanto por lib/auth.ts (Node).
const ROTA_PADRAO_POR_PAPEL: Record<Papel, string> = {
  dono: "/home",
  membro: "/home",
  consultor: "/central-consultor",
  adminPlataforma: "/noticias",
};

export function rotaPadraoParaPapel(papel: Papel) {
  return ROTA_PADRAO_POR_PAPEL[papel];
}
