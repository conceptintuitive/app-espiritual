// lib/quizEtapas.js — contador anônimo das etapas do quiz (migração 0034).
// Puro: testado em tests/quizEtapas.test.js. O navegador manda a etapa por
// app/components/home/contarEtapa.js → POST /api/quiz/etapa
// (lib/quizEtapasServidor.js), e a prévia (/api/social/previa) mostra o funil.
//
// Por quê: o GA4 e os pixels só enxergam quem aceita cookies, e o banco só
// guardava quem chegou na etapa 4 (leads_parciais) e quem concluiu. Isto conta
// toda sessão, sem nada que identifique: um id aleatório da aba + a etapa + o
// rótulo da campanha guardado no aparelho.

export const ETAPAS = [
  { n: 0, rotulo: 'Viu a home' },
  { n: 1, rotulo: 'Abriu o quiz' },
  { n: 2, rotulo: 'Etapa 2' },
  { n: 3, rotulo: 'Etapa 3 (nascimento)' },
  { n: 4, rotulo: 'Etapa 4 (nome e e-mail)' },
  { n: 5, rotulo: 'Concluiu' },
];
export const ORIGENS = ['instagram', 'tiktok', 'meta', 'google', 'outro', 'direto'];

export const etapaValida = (e) => Number.isInteger(e) && e >= 0 && e <= 5;
export const sessaoValida = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const META = new Set(['facebook', 'fb', 'meta', 'ig_ads', 'facebook_ads', 'meta_ads']);

/**
 * De onde veio a visita, pelo que ficou no aparelho (lib/atribuicao.js, ic_atrib):
 * utm_source conhecido, ou o tipo de clique de anúncio, ou "direto".
 * @param {{ utm_source?: string|null, clique?: 'google'|'meta'|null }} p
 */
export function origemDaVisita({ utm_source = null, clique = null } = {}) {
  const s = typeof utm_source === 'string' ? utm_source.trim().toLowerCase() : '';
  if (s) {
    if (s === 'instagram' || s === 'ig') return 'instagram';
    if (s === 'tiktok') return 'tiktok';
    if (META.has(s)) return 'meta';
    if (s === 'google' || s === 'adwords' || s === 'googleads') return 'google';
    return 'outro';
  }
  if (clique === 'google' || clique === 'meta') return clique;
  return 'direto';
}

/** Dia em Brasília (UTC−3, sem horário de verão). */
export const diaBrasilia = (ms = Date.now()) => new Date(ms - 3 * 3600000).toISOString().slice(0, 10);

/**
 * Linha pronta pro banco, ou null se o pedido não serve.
 * @param {object} corpo  { sessao, etapa, utm_source?, clique? }
 */
export function linhaDaEtapa(corpo, agora = Date.now()) {
  if (!corpo || typeof corpo !== 'object') return null;
  const etapa = Number(corpo.etapa);
  if (!etapaValida(etapa) || !sessaoValida(corpo.sessao)) return null;
  return { dia: diaBrasilia(agora), sessao: corpo.sessao.toLowerCase(), etapa, origem: origemDaVisita(corpo) };
}

/**
 * Funil por origem a partir do resumo (quiz_etapas_resumo: dia, origem, etapa, sessoes).
 * @returns {{ linhas: { origem: string, etapas: number[] }[], total: { origem: 'total', etapas: number[] } }}
 */
export function funilDoQuiz(resumo) {
  const porOrigem = new Map();
  for (const r of resumo || []) {
    const e = Number(r.etapa);
    if (!etapaValida(e)) continue;
    const o = ORIGENS.includes(r.origem) ? r.origem : 'outro';
    if (!porOrigem.has(o)) porOrigem.set(o, [0, 0, 0, 0, 0, 0]);
    porOrigem.get(o)[e] += Number(r.sessoes) || 0;
  }
  const linhas = [...porOrigem].map(([origem, etapas]) => ({ origem, etapas }))
    .sort((a, b) => b.etapas[0] - a.etapas[0] || b.etapas[1] - a.etapas[1] || ORIGENS.indexOf(a.origem) - ORIGENS.indexOf(b.origem));
  const total = { origem: 'total', etapas: [0, 1, 2, 3, 4, 5].map((i) => linhas.reduce((s, l) => s + l.etapas[i], 0)) };
  return { linhas, total };
}

/** "37%" de parte sobre base (ou "–"). */
export function taxa(parte, base) {
  if (!base) return '–';
  return `${Math.round((parte / base) * 100)}%`;
}

/** A etapa com a maior perda (entre abrir e concluir), pra prévia destacar. */
export function maiorPerda(etapas) {
  let pior = null;
  for (let i = 2; i <= 5; i++) {
    const antes = etapas[i - 1];
    if (!antes) continue;
    const perda = 1 - etapas[i] / antes;
    if (!pior || perda > pior.perda) pior = { de: i - 1, para: i, perda };
  }
  return pior;
}
