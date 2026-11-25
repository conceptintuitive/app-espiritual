// lib/atribuicao.js
// Atribuição de anúncios do Google pros eventos de compra enviados pelo
// servidor (GA4 Measurement Protocol). Puro (sem window/fetch): testado em
// tests/atribuicao.test.js. O front que usa isto é
// app/components/CapturaAtribuicao.js; o servidor, lib/ga4.js.
//
// Por quê: o `purchase` sai do servidor (webhooks MP/Stripe), sem cookie do
// navegador. Com um client_id inventado, o GA4 cria um usuário novo, sem
// sessão e sem origem, e o Google Ads não tem a quem atribuir a compra
// ("conversões pendentes"). Com o client_id real (_ga) + o session_id da
// sessão do checkout, o GA4 junta a compra à sessão que veio do anúncio.
//
// LGPD: o gclid/gbraid/wbraid ficam SÓ no aparelho (localStorage ic_atrib)
// até a pessoa aceitar cookies; com ic_consent !== 'sim' o front manda
// { consent: false } + as UTMs da chegada (rótulos de campanha, ex.
// utm_source=instagram, que não identificam ninguém e nunca vão pro Google) e
// nada identificável vai pra análise nem pro Google.

/** ID do GA4 da web (o mesmo do gtag em app/layout.js). */
export const GA4_WEB_ID = 'G-4YT1QFSD1P';
export const CHAVE_ATRIB = 'ic_atrib';
/** Janela de clique do Google Ads (90 dias). */
export const VALIDADE_ATRIB_MS = 90 * 86400000;

const CLIQUES = ['gclid', 'gbraid', 'wbraid'];
const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

/**
 * Click IDs e UTMs da URL de entrada. null se não tem nenhum.
 * @param {string} search  ex.: "?gclid=abc&utm_source=google"
 */
export function cliquesDaUrl(search) {
  let p;
  try { p = new URLSearchParams(search || ''); } catch { return null; }
  const out = {};
  for (const k of [...CLIQUES, ...UTMS]) {
    const v = (p.get(k) || '').trim();
    if (v) out[k] = v.slice(0, 250);
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Último clique ganha: uma visita nova com click ID ou UTM substitui a
 * anterior; sem nada na URL, mantém a anterior (se ainda dentro de 90 dias).
 */
export function mesclarCliques(anterior, novo, agora = Date.now(), landing = '') {
  if (novo) return { ...novo, landing: String(landing || '').slice(0, 200), ts: agora };
  if (anterior?.ts && agora - anterior.ts <= VALIDADE_ATRIB_MS) return anterior;
  return null;
}

/** "GA1.1.123456789.1700000000" → "123456789.1700000000" */
export function clientIdDoCookie(valor) {
  const m = String(valor || '').match(/^GA\d\.\d+\.(\d+\.\d+)$/);
  return m ? m[1] : null;
}

/**
 * Cookie _ga_<container> → session_id.
 * Formato antigo "GS1.1.1700000000.3.1.1700000100.0.0.0" e novo
 * "GS2.1.s1700000000$o3$g1$t1700000100$j0$l0$h0".
 */
export function sessionIdDoCookie(valor) {
  const v = String(valor || '');
  const novo = v.match(/^GS\d\.\d+\.s(\d+)/);
  if (novo) return novo[1];
  const antigo = v.match(/^GS\d\.\d+\.(\d+)\./);
  return antigo ? antigo[1] : null;
}

const ok = (re) => (v) => (typeof v === 'string' && re.test(v) ? v : null);
const validar = {
  client_id: ok(/^\d{1,20}\.\d{1,20}$/),
  session_id: ok(/^\d{1,20}$/),
  gclid: ok(/^[\w-]{10,250}$/),
  gbraid: ok(/^[\w-]{10,250}$/),
  wbraid: ok(/^[\w-]{10,250}$/),
};

/**
 * Limpa o que veio do navegador antes de gravar na análise. Sem consentimento,
 * guarda { consent: false } + as UTMs (nenhum identificador).
 * @returns {object|null}
 */
export function normalizarAtribuicao(bruto, agora = new Date()) {
  if (!bruto || typeof bruto !== 'object') return null;
  const consent = bruto.consent === true;
  const out = { consent, em: agora.toISOString() };
  if (consent) {
    for (const [k, f] of Object.entries(validar)) {
      const v = f(bruto[k]);
      if (v) out[k] = v;
    }
  }
  for (const k of UTMS) {
    if (typeof bruto[k] === 'string' && bruto[k].trim()) out[k] = bruto[k].trim().slice(0, 150);
  }
  if (typeof bruto.clique_ts === 'number' && Number.isFinite(bruto.clique_ts)) out.clique_ts = bruto.clique_ts;
  return out;
}

/**
 * Corpo do POST pro GA4 Measurement Protocol (evento purchase).
 * Com a atribuição consentida: client_id real + session_id (junta a compra à
 * sessão do anúncio) e consent GRANTED. Sem: client_id do servidor e DENIED.
 * @param {{ transactionId: string, value: number, currency: string, atribuicao?: object|null, clientIdReserva: string, item?: string }} p
 */
export function payloadPurchaseGA4({ transactionId, value, currency, atribuicao = null, clientIdReserva, item = null }) {
  const comConsent = atribuicao?.consent === true;
  const params = { transaction_id: String(transactionId), value: Number(value) || 0, currency: String(currency || 'BRL').toUpperCase() };
  if (comConsent && atribuicao.session_id) {
    params.session_id = Number(atribuicao.session_id);
    params.engagement_time_msec = 1; // sem isso o GA4 não conta o evento na sessão
  }
  if (comConsent) for (const k of CLIQUES) if (atribuicao[k]) params[k] = atribuicao[k];
  if (item) params.items = [{ item_id: item, item_name: item, price: params.value, quantity: 1 }];
  const corpo = {
    client_id: (comConsent && atribuicao.client_id) || clientIdReserva,
    events: [{ name: 'purchase', params }],
  };
  if (atribuicao) {
    const c = comConsent ? 'GRANTED' : 'DENIED';
    corpo.consent = { ad_user_data: c, ad_personalization: c };
  }
  return corpo;
}

/**
 * Linhas do CSV de "conversões de cliques" do Google Ads (upload offline).
 * Só compras com gclid e consentimento. Hora no formato aceito pelo Google
 * ("yyyy-MM-dd HH:mm:ss-0300").
 * @param {Array<{ paid_at: string, valor_pago: number|null, atribuicao: object|null }>} linhas
 */
export function csvConversoesGoogleAds(linhas, nomeConversao) {
  const fmt = (iso) => {
    const d = new Date(new Date(iso).getTime() - 3 * 3600000); // horário de Brasília
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}-0300`;
  };
  const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const out = ['Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency'];
  for (const l of linhas || []) {
    const gclid = l?.atribuicao?.consent === true ? l.atribuicao.gclid : null;
    if (!gclid || !l.paid_at) continue;
    out.push([csv(gclid), csv(nomeConversao), csv(fmt(l.paid_at)), csv(Number(l.valor_pago) || 0), csv('BRL')].join(','));
  }
  return `${out.join('\n')}\n`;
}
