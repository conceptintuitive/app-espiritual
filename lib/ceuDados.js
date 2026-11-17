// lib/ceuDados.js
// Repasse dos dados respondidos no /ceu (Olho Cósmico) pro quiz da home, pra
// pessoa não responder de novo. Via localStorage (nunca query string: nome e
// data de nascimento não devem parar na URL, no GA4 nem em logs).
//
// Chave: ic_ceu_dados — expira em 24h. `abrirQuiz` faz a home abrir o quiz
// sozinha uma vez (o flag é consumido; os dados continuam pro pré-preenchimento).

export const CHAVE_CEU = 'ic_ceu_dados';
const VALIDADE_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {{ v: 1, nome: string, dataNascimento: string, hora: string|null,
 *   cidade: { ibge: number, nome: string, uf: string, lat: number, lon: number, tz: string } | null,
 *   abrirQuiz: boolean, salvoEm: number }} CeuDados
 */

/** @param {Omit<CeuDados, 'v' | 'salvoEm' | 'abrirQuiz'>} dados */
export function salvarCeuDados(dados) {
  try {
    window.localStorage.setItem(CHAVE_CEU, JSON.stringify({ v: 1, ...dados, abrirQuiz: true, salvoEm: Date.now() }));
  } catch {}
}

/** @returns {CeuDados|null} null se não houver, estiver corrompido ou vencido */
export function lerCeuDados() {
  try {
    const raw = window.localStorage.getItem(CHAVE_CEU);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !d.salvoEm || Date.now() - d.salvoEm > VALIDADE_MS || !d.dataNascimento) {
      window.localStorage.removeItem(CHAVE_CEU);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

/** Lê e já desliga o flag de abrir o quiz (pra não reabrir em todo F5). */
export function consumirAbrirQuiz() {
  const d = lerCeuDados();
  if (!d?.abrirQuiz) return false;
  try {
    window.localStorage.setItem(CHAVE_CEU, JSON.stringify({ ...d, abrirQuiz: false }));
  } catch {}
  return true;
}

/** Depois que a análise foi criada, os dados não servem mais. */
export function limparCeuDados() {
  try { window.localStorage.removeItem(CHAVE_CEU); } catch {}
}
