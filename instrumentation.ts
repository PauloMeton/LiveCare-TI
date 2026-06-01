// Hook do Next.js — chamado uma vez na inicializacao do server.
// Carrega o config do Sentry certo dependendo do runtime.

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura erros do Server Components / Server Actions
export async function onRequestError(
  err: unknown,
  request: Parameters<typeof import("@sentry/nextjs").captureRequestError>[1],
  context: Parameters<typeof import("@sentry/nextjs").captureRequestError>[2]
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
