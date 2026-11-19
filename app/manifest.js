// Manifest do PWA. Instalar o site no celular abre direto no Seu Dia.
export default function manifest() {
  return {
    name: 'Intuitive Concept — Seu Dia',
    short_name: 'Seu Dia',
    description: 'Seu dia lido pelo seu mapa: astrologia chinesa, numerologia, Lua e tarô.',
    start_url: '/seu-dia?origem=app',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0118',
    theme_color: '#0a0118',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
