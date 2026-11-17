// lib/baseUrl.js — URL base do site pra chamadas server-to-server (ex.: /api/send).
// Mesma ordem dos checkouts: NEXT_PUBLIC_BASE_URL → VERCEL_URL (deploy atual) →
// localhost. Assim preview e local não disparam e-mail pela produção.
//
// Atenção: com a proteção de deploy da Vercel ligada, um preview chamando a
// própria URL (VERCEL_URL) recebe 401 — o e-mail de acesso não sai no preview
// a menos que NEXT_PUBLIC_BASE_URL aponte pra outro lugar. Em produção,
// NEXT_PUBLIC_BASE_URL deve ser https://intuitiveconcept.com.br.

export function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return url.replace(/\/+$/, '');
}
