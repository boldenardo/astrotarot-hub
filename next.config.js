/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint runs in the editor/CI — never block a production build on it.
  // (Locally ESLint is skipped anyway; this keeps Vercel builds consistent.)
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // Cache de 24 horas
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === "production",
  // },
  poweredByHeader: false,
  // Otimizações de performance
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Headers de cache
  async redirects() {
    // Fortune/Prosperity aposentado: a URL antiga aponta para o sucessor
    // semântico (Luck Ritual). 301 preserva o que houver de SEO/backlinks.
    return [
      { source: "/abundance", destination: "/rituals/luck", permanent: true },
      // V1 da VSL aposentada (26/08): vendia os planos legados (PACK5/
      // assinatura) por um checkout hospedado sem trackeamento — a decisão
      // "uma única página de dinheiro" não comporta um segundo caminho.
      // Zero sessões em 25-26/08; o código fica, só a rota é coberta.
      // 307 (não-permanente): reverter é apagar esta linha.
      { source: "/quiz/vsl", destination: "/quiz/vsl-v2", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
