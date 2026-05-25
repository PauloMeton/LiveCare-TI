"use client";

// Última linha de defesa: roda quando o erro acontece DENTRO do layout raiz.
// Precisa renderizar <html> e <body> próprios, sem depender do design system.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "#f7f7f5",
          color: "#0a0a09",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            border: "1px solid #ebebe8",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 4px 6px -1px rgb(10 10 9 / 0.10), 0 2px 4px -2px rgb(10 10 9 / 0.08)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden>
            ⚠️
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
            Erro inesperado
          </h1>
          <p style={{ fontSize: 13, color: "#4a4a47", margin: "0 0 24px" }}>
            O LiveCare TI encontrou um problema sério ao carregar. Tente recarregar a página.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 11,
                fontFamily: "ui-monospace, Menlo, Monaco, monospace",
                color: "#9a9a96",
                margin: "0 0 16px",
              }}
            >
              Código: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 18px",
              background: "#ffcc00",
              color: "#0a0a09",
              border: 0,
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
