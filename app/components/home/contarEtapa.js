// Conta a etapa do quiz em POST /api/quiz/etapa (lib/quizEtapas.js), sem nada
// que identifique: um id aleatório desta aba (sessionStorage), a etapa e o
// rótulo da campanha (o da URL desta visita; sem ele, o que ficou no aparelho
// em ic_atrib, último clique). 1x por etapa na aba.
// Sem import nenhum de propósito: entra no pacote da home (página dos anúncios).

export function contarEtapa(etapa) {
  try {
    const ss = window.sessionStorage;
    let sessao = ss.getItem('ic_quiz_sessao');
    if (!sessao) {
      sessao = window.crypto?.randomUUID?.() || null;
      if (!sessao) return;
      ss.setItem('ic_quiz_sessao', sessao);
    }
    const marca = `ic_quiz_etapa_${etapa}`;
    if (ss.getItem(marca)) return;
    ss.setItem(marca, '1');
    // A URL desta visita manda (na 1ª visita o ic_atrib ainda nem foi gravado).
    const u = new URLSearchParams(window.location.search);
    let a = {};
    if (['utm_source', 'gclid', 'gbraid', 'wbraid', 'fbclid'].some((k) => u.get(k))) {
      a = { utm_source: u.get('utm_source'), gclid: u.get('gclid'), gbraid: u.get('gbraid'), wbraid: u.get('wbraid'), fbclid: u.get('fbclid') };
    } else {
      try { a = JSON.parse(window.localStorage.getItem('ic_atrib') || 'null') || {}; } catch {}
    }
    const clique = a.gclid || a.gbraid || a.wbraid ? 'google' : a.fbclid ? 'meta' : null;
    fetch('/api/quiz/etapa', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessao, etapa, utm_source: a.utm_source || null, clique }),
    }).catch(() => {});
  } catch {}
}
