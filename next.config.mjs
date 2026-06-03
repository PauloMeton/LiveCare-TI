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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
