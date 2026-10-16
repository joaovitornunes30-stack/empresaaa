import { CATEGORIA_LABEL } from "@/lib/noticias";
import type { NoticiaResumo } from "@/lib/noticias";

function formatarDataCurta(data: Date) {
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function NoticiaCard({ noticia, compacta = false }: { noticia: NoticiaResumo; compacta?: boolean }) {
  return (
    <a
      href={noticia.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
          {CATEGORIA_LABEL[noticia.categoria]}
        </span>
        {noticia.destaque && (
          <span className="rounded-full bg-accent-bg px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            Destaque
          </span>
        )}
        {noticia.exemplo && (
          <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/60">
            Exemplo — dado fictício
          </span>
        )}
      </div>
      <p className={`font-display font-semibold text-foreground ${compacta ? "text-sm" : "text-base"}`}>{noticia.titulo}</p>
      {!compacta && <p className="mt-1 text-sm text-foreground/70">{noticia.resumo}</p>}
      <p className="mt-2 text-xs text-foreground/50">
        {noticia.fonteNome} · {formatarDataCurta(noticia.dataPublicacao)}
      </p>
    </a>
  );
}
