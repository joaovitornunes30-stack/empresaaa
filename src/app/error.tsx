"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-xl font-bold text-foreground">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-foreground/60">
        Não foi possível concluir essa ação. Tente novamente — se o problema continuar, use
        &ldquo;Relatar problema&rdquo; no menu da conta.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
      >
        Tentar novamente
      </button>
    </main>
  );
}
