"use client";

import { useState } from "react";
import { NoticiaCard } from "@/components/noticias/noticia-card";
import { CATEGORIA_LABEL, CATEGORIAS, filtrarPorCategoria, type CategoriaNoticia, type NoticiaResumo } from "@/lib/noticias";

export function NoticiasFeed({ noticias }: { noticias: NoticiaResumo[] }) {
  const [categoria, setCategoria] = useState<CategoriaNoticia | null>(null);
  const noticiasFiltradas = filtrarPorCategoria(noticias, categoria);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Notícias</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Gestão, impostos, regulação e mercado — relevante para a sua clínica.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoria(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            categoria === null ? "border-primary bg-primary/10 text-primary-dark" : "border-border text-foreground/60"
          }`}
        >
          Todas
        </button>
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoria(cat)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              categoria === cat ? "border-primary bg-primary/10 text-primary-dark" : "border-border text-foreground/60"
            }`}
          >
            {CATEGORIA_LABEL[cat]}
          </button>
        ))}
      </div>

      {noticiasFiltradas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground/60">
          Nenhuma notícia por aqui ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {noticiasFiltradas.map((noticia) => (
            <NoticiaCard key={noticia.id} noticia={noticia} />
          ))}
        </div>
      )}
    </main>
  );
}
