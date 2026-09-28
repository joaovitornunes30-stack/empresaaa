import Link from "next/link";
import { formatarMoeda } from "@/lib/financeiro";
import { calcularSemaforoRetirada, type EstadoRetiradaSaudavel } from "@/lib/retiradas";

const SEMAFORO_DOT: Record<"verde" | "laranja" | "vermelho" | "cinza", string> = {
  verde: "bg-good",
  laranja: "bg-accent",
  vermelho: "bg-muted-red",
  cinza: "bg-foreground/25",
};

/** Pequeno indicador do semáforo de retiradas do mês, com link para a aba
 * Retiradas — só é renderizado por quem já tem acesso a ela (ver
 * temPermissaoAba em analise/page.tsx). */
export function RetiradasIndicador({
  estado,
  totalRetiradoMes,
}: {
  estado: EstadoRetiradaSaudavel;
  totalRetiradoMes: number;
}) {
  const semaforo = calcularSemaforoRetirada(estado, totalRetiradoMes);

  return (
    <Link
      href="/retiradas"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary-dark"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${SEMAFORO_DOT[semaforo]}`} />
      Retiradas do mês: {formatarMoeda(totalRetiradoMes)}
    </Link>
  );
}
