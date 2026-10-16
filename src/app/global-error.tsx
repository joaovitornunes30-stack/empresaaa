"use client";

// Só é usado quando o erro acontece no próprio layout raiz (error.tsx não
// cobre esse caso) — por isso precisa do próprio <html>/<body>. Mesma regra
// de nunca expor detalhes internos (mensagem/stack) ao usuário.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 16, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Algo deu errado</h1>
          <p style={{ maxWidth: 360, fontSize: 14, color: "#6b6475" }}>
            Não foi possível carregar a página. Tente novamente em instantes.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ borderRadius: 12, background: "#6d28d9", color: "#fff", padding: "10px 16px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
