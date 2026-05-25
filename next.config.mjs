/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Reduz o cache do router pro mínimo permitido pelo Next 16 (30s).
  // Combinado com Cache-Control: no-store no middleware, evita o flash
  // do layout da sessão anterior ao usar voltar/avançar do navegador.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 30,
    },
  },
};
export default nextConfig;
