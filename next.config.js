/** @type {import('next').NextConfig} */
const nextConfig = {
  // As artes do Instagram/TikTok (app/api/social/imagem) são geradas na hora
  // e leem o céu e as fontes do disco: garante que os arquivos vão junto
  // pra function na Vercel.
  outputFileTracingIncludes: {
    '/api/social/imagem/[data]/[arquivo]': ['./public/olho/sky.json', './lib/blogCapaFontes/**/*'],
  },
  async redirects() {
    return [
      // Não houve Mercúrio retrógrado em setembro de 2026: o post virou atemporal.
      { source: '/blog/mercurio-retrogrado-setembro', destination: '/blog/mercurio-retrogrado', permanent: true },
      { source: '/blog/mercurio-retrogrado-setembro/:resto*', destination: '/blog/mercurio-retrogrado/:resto*', permanent: true },
    ];
  },
};
export default nextConfig;
