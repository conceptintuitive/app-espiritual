'use client';

// Atribuição dos anúncios do Google (ver lib/atribuicao.js).
//  - <CapturaAtribuicao /> (no layout raiz): na entrada, guarda gclid/gbraid/
//    wbraid e as UTMs da URL em localStorage ic_atrib (só no aparelho; último
//    clique ganha; vale 90 dias). Não manda nada pra lugar nenhum.
//  - coletarAtribuicao(): chamado antes de gerar a análise e antes de cada
//    checkout. Sem aceite de cookies (ic_consent !== 'sim') devolve só
//    { consent: false }. Com aceite: client_id e session_id do GA4 (gtag
//    'get', com o cookie _ga de reserva) + os cliques guardados.

import { useEffect } from 'react';
import {
  GA4_WEB_ID, CHAVE_ATRIB, cliquesDaUrl, mesclarCliques, clientIdDoCookie, sessionIdDoCookie,
} from '@/lib/atribuicao';

function lerJson(chave) {
  try { return JSON.parse(window.localStorage.getItem(chave) || 'null'); } catch { return null; }
}

export default function CapturaAtribuicao() {
  useEffect(() => {
    try {
      const atual = lerJson(CHAVE_ATRIB);
      const novo = mesclarCliques(atual, cliquesDaUrl(window.location.search), Date.now(), window.location.pathname);
      if (novo !== atual) {
        if (novo) window.localStorage.setItem(CHAVE_ATRIB, JSON.stringify(novo));
        else window.localStorage.removeItem(CHAVE_ATRIB);
      }
    } catch {}
  }, []);
  return null;
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
  if (!consent) return { consent: false };
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
