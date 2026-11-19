// lib/seoChines.js — dados das páginas estáticas de SEO da astrologia chinesa
// (/astrologia-chinesa/animal/[animal] e /astrologia-chinesa/dez-deuses/[deus]).
// Puro: tudo calculado de lib/bazi.js.

import { RAMOS, TRONCOS, ELEMENTOS, DEZ_DEUSES, pilarDoAnoGregoriano, relacoesRamos } from './bazi.js';

export const animalPorSlug = (slug) => {
  const i = RAMOS.findIndex((r) => r.slug === slug);
  return i >= 0 ? { i, ...RAMOS[i] } : null;
};

/** Anos do animal entre `de` e `ate`, com o elemento do ano (ex.: 1994 → Madeira Yang). */
export function anosDoAnimal(i, de = 1924, ate = 2031) {
  const out = [];
  for (let y = de; y <= ate; y++) {
    const p = pilarDoAnoGregoriano(y);
    if (p.ramo !== i) continue;
    const t = TRONCOS[p.tronco];
    out.push({ ano: y, elemento: ELEMENTOS[t.elemento].nome, yang: t.yang });
  }
  return out;
}

/** Como o animal i se relaciona com os outros 11, agrupado. */
export function relacoesDoAnimal(i) {
  const g = { combinacao: [], trio: [], choque: [], atrito: [] };
  for (let j = 0; j < 12; j++) {
    if (j === i) continue;
    const r = relacoesRamos(i, j);
    if (r.includes('combinacao')) g.combinacao.push(j);
    if (r.includes('trio')) g.trio.push(j);
    if (r.includes('choque')) g.choque.push(j);
    if (r.includes('punicao') || r.includes('dano')) g.atrito.push(j);
  }
  return g;
}

const SLUG_DEUS = {
  amigo: 'amigo', rival: 'rival', deusComida: 'deus-da-comida', oficialFerido: 'oficial-ferido',
  riquezaIndireta: 'riqueza-indireta', riquezaDireta: 'riqueza-direta', seteMatancas: 'sete-matancas',
  oficialDireto: 'oficial-direto', recursoIndireto: 'recurso-indireto', recursoDireto: 'recurso-direto',
};
// Relação do elemento do Deus com o seu (chaves de RELACAO_DEUS) e polaridade.
const REL_DEUS = {
  amigo: ['mesmo', 'igual'], rival: ['mesmo', 'oposta'], deusComida: ['gero', 'igual'], oficialFerido: ['gero', 'oposta'],
  riquezaIndireta: ['controlo', 'igual'], riquezaDireta: ['controlo', 'oposta'], seteMatancas: ['controla', 'igual'],
  oficialDireto: ['controla', 'oposta'], recursoIndireto: ['gera', 'igual'], recursoDireto: ['gera', 'oposta'],
};

export const DEUSES = Object.keys(DEZ_DEUSES).map((chave) => ({
  chave, slug: SLUG_DEUS[chave], ...DEZ_DEUSES[chave], relacao: REL_DEUS[chave][0], polaridade: REL_DEUS[chave][1],
}));
export const deusPorSlug = (slug) => DEUSES.find((d) => d.slug === slug) || null;
