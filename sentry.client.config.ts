// Sentry no client (browser). No-op se NEXT_PUBLIC_SENTRY_DSN nao estiver setado.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Performance — 10% das transacoes (sobra no free tier)
    tracesSampleRate: 0.1,
    // Replay (gravacao de tela em erros) — 0% por padrao pra economizar quota
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    // Ambiente
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    // Nao envia erros de dev local (verboso e sem valor)
    enabled: process.env.NODE_ENV === "production",
    // Filtra ruido conhecido
    ignoreErrors: [
      // Extensoes de browser
      "top.GLOBALS",
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Autoplay bloqueado (notif sound) — esperado
      "NotAllowedError",
    ],
  });
}
