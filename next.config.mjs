/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Reduz o cache do router pro minimo permitido pelo Next 16 (30s).
  // Combinado com Cache-Control: no-store no middleware, evita o flash
  // do layout da sessao anterior ao usar voltar/avancar do navegador.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 30,
    },
  },
  // Headers de seguranca aplicados a todas as rotas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Impede embed em iframe (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Impede MIME-sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Forca HTTPS por 2 anos (preload-ready)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Nao envia Referer pra outros sites
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Bloqueia APIs sensiveis que o app nao usa
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

// Wrap com Sentry SO se o DSN estiver setado (caso contrario nao gera source maps
// nem adiciona overhead ao build).
let exported = nextConfig;
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = await import("@sentry/nextjs");
  exported = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
}

export default exported;
