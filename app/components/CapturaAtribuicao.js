'use client';

// Atribuição dos anúncios do Google (ver lib/atribuicao.js).
//  - <CapturaAtribuicao /> (no layout raiz): na entrada, guarda gclid/gbraid/
//    wbraid e as UTMs da URL em localStorage ic_atrib (só no aparelho; último
//    clique ganha; vale 90 dias). Não manda nada pra lugar nenhum.
//  - coletarAtribuicao(): chamado antes de gerar a análise e antes de cada
//    checkout. Sem aceite de cookies (ic_consent !== 'sim') devolve só
//    { consent: false } + as UTMs (rótulos de campanha, não identificam).
//    Com aceite: client_id e session_id do GA4 (gtag 'get', com o cookie _ga
//    de reserva) + os cliques guardados.
//  - Visita das redes (utm_source=instagram|tiktok): conta 1x por sessão em
//    POST /api/social/visita (anônimo; lib/utmSocial.js).
//  - utmGuardada(): só as UTMs guardadas, pro perfil do Seu Dia.
//  - declararFormato(utm): /comecar, a pessoa tocou num post (formato declarado).

import { useEffect } from 'react';
import {
  GA4_WEB_ID, CHAVE_ATRIB, cliquesDaUrl, mesclarCliques, clientIdDoCookie, sessionIdDoCookie,
} from '@/lib/atribuicao';
import { visitaDasRedes } from '@/lib/utmSocial';

function lerJson(chave) {
  try { return JSON.parse(window.localStorage.getItem(chave) || 'null'); } catch { return null; }
}

export default function CapturaAtribuicao() {
  useEffect(() => {
    try {
      const atual = lerJson(CHAVE_ATRIB);
      const daUrl = cliquesDaUrl(window.location.search);
      const novo = mesclarCliques(atual, daUrl, Date.now(), window.location.pathname);
      if (novo !== atual) {
        if (novo) window.localStorage.setItem(CHAVE_ATRIB, JSON.stringify(novo));
        else window.localStorage.removeItem(CHAVE_ATRIB);
      }
      contarVisitaDasRedes(daUrl);
    } catch {}
  }, []);
  return null;
}

function postarVisita(corpo) {
  fetch('/api/social/visita', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }).catch(() => {});
}

// 1 visita por sessão e por campanha (recarregar a página não conta de novo).
// `sessao` = id aleatório desta aba, só pra declarar o formato depois (declararFormato).
function contarVisitaDasRedes(daUrl) {
  const v = visitaDasRedes(daUrl);
  if (!v) return;
  const marca = JSON.stringify(v);
  let sessao = null;
  try {
    if (window.sessionStorage.getItem('ic_visita_social') === marca) return;
    window.sessionStorage.setItem('ic_visita_social', marca);
    sessao = window.crypto?.randomUUID?.() || null;
    if (sessao) window.sessionStorage.setItem('ic_visita_sessao', sessao);
  } catch {}
  postarVisita({ utm_source: v.source, utm_medium: v.medium, utm_campaign: v.campaign, utm_content: v.content, sessao });
}

/**
 * /comecar: a pessoa tocou num post. A UTM guardada (que vai com o quiz, o
 * teste e a compra) e a visita desta sessão passam pro formato tocado. Uma vez
 * por sessão, e só se ela chegou pela mesma rede do post.
 * @param {{ utm_source: string, utm_medium: string, utm_campaign: string, utm_content?: string }} utm
 * @returns {boolean} se declarou agora
 */
export function declararFormato(utm) {
  try {
    const atual = lerJson(CHAVE_ATRIB);
    if (!atual?.utm_source || atual.utm_source !== utm.utm_source) return false;
    if (window.sessionStorage.getItem('ic_declarado')) return false;
    window.sessionStorage.setItem('ic_declarado', '1');
    const { utm_content: _antigo, ...resto } = atual;
    window.localStorage.setItem(CHAVE_ATRIB, JSON.stringify({
      ...resto,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      ...(utm.utm_content ? { utm_content: utm.utm_content } : {}),
      declarado: true,
    }));
    const sessao = window.sessionStorage.getItem('ic_visita_sessao');
    if (sessao) postarVisita({ declarar: true, sessao, ...utm });
    // A URL ainda tem ?utm_medium=bio: sem isso, recarregar a página desfaria a declaração.
    if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname);
    return true;
  } catch {
    return false;
  }
}

/** Só as UTMs da chegada (+ quando), sem nada que identifique. Vai pro perfil do Seu Dia. */
export function utmGuardada() {
  const c = lerJson(CHAVE_ATRIB);
  if (!c?.utm_source) return null;
  return {
    utm_source: c.utm_source, utm_medium: c.utm_medium, utm_campaign: c.utm_campaign,
    utm_content: c.utm_content, utm_term: c.utm_term, clique_ts: c.ts,
  };
}

function cookie(nome) {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${nome.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&')}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
}

// gtag('get') com prazo: se o gtag não responder (bloqueador, rede), segue sem.
function gtagGet(campo, ms = 900) {
  return new Promise((ok) => {
    let feito = false;
    const fim = (v) => { if (!feito) { feito = true; ok(v ?? null); } };
    setTimeout(() => fim(null), ms);
    try {
      if (typeof window.gtag !== 'function') return fim(null);
      window.gtag('get', GA4_WEB_ID, campo, (v) => fim(v != null ? String(v) : null));
    } catch { fim(null); }
  });
}

/** @returns {Promise<object>} o que vai no body dos checkouts e do gerar-analise como `atribuicao` */
export async function coletarAtribuicao() {
  let consent = false;
  try { consent = window.localStorage.getItem('ic_consent') === 'sim'; } catch {}
  if (!consent) return { consent: false, ...(utmGuardada() || {}) };
  const [cid, sid] = await Promise.all([gtagGet('client_id'), gtagGet('session_id')]);
  const container = GA4_WEB_ID.replace(/^G-/, '');
  const cliques = lerJson(CHAVE_ATRIB) || {};
  return {
    consent: true,
    client_id: cid || clientIdDoCookie(cookie('_ga')),
    session_id: sid || sessionIdDoCookie(cookie(`_ga_${container}`)),
    gclid: cliques.gclid, gbraid: cliques.gbraid, wbraid: cliques.wbraid,
    utm_source: cliques.utm_source, utm_medium: cliques.utm_medium, utm_campaign: cliques.utm_campaign,
    utm_content: cliques.utm_content, utm_term: cliques.utm_term,
    clique_ts: cliques.ts,
  };
}
