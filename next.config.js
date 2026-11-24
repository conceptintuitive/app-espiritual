/** @type {import('next').NextConfig} */
const nextConfig = {
  // As artes do Instagram/TikTok (app/api/social/imagem) são geradas na hora
  // e leem o céu e as fontes do disco: garante que os arquivos vão junto
  // pra function na Vercel.
  outputFileTracingIncludes: {
    '/api/social/imagem/[data]/[arquivo]': ['./public/olho/sky.json', './lib/blogCapaFontes/**/*'],
  },
};
export default nextConfig;
