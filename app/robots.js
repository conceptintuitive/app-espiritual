// robots.txt — tudo liberado menos a API. As páginas pessoais (/manual,
// /resultado, /previsao-do-ano, /human-design, /compatibilidade-completa,
// /assinar/obrigado) NÃO entram aqui de propósito: elas têm noindex no
// layout, e o Google precisa conseguir abrir a página pra ler o noindex.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: 'https://intuitiveconcept.com.br/sitemap.xml',
    host: 'https://intuitiveconcept.com.br',
  };
}
