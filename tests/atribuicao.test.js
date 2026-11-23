// Testes de lib/atribuicao.js (atribuição do Google Ads no purchase server-side) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cliquesDaUrl, mesclarCliques, clientIdDoCookie, sessionIdDoCookie, normalizarAtribuicao,
  payloadPurchaseGA4, csvConversoesGoogleAds, VALIDADE_ATRIB_MS,
} from '../lib/atribuicao.js';

const GCLID = 'Cj0KCQiA_exemplo-123';

test('cliques da URL e último clique ganha (90 dias)', () => {
  assert.equal(cliquesDaUrl('?ref=bio'), null);
  assert.deepEqual(cliquesDaUrl(`?gclid=${GCLID}&utm_source=google&utm_campaign=mapa`), { gclid: GCLID, utm_source: 'google', utm_campaign: 'mapa' });
  const t0 = 1_700_000_000_000;
  const a = mesclarCliques(null, { gclid: GCLID }, t0, '/');
  assert.deepEqual(a, { gclid: GCLID, landing: '/', ts: t0 });
  assert.equal(mesclarCliques(a, null, t0 + 1000), a); // visita sem nada mantém
  assert.equal(mesclarCliques(a, null, t0 + VALIDADE_ATRIB_MS + 1), null); // venceu
  assert.equal(mesclarCliques(a, { gbraid: 'gb_123456789' }, t0 + 5).gbraid, 'gb_123456789'); // novo clique substitui
});

test('client_id e session_id dos cookies do GA4 (formatos antigo e novo)', () => {
  assert.equal(clientIdDoCookie('GA1.1.1234567890.1700000000'), '1234567890.1700000000');
  assert.equal(clientIdDoCookie('GA1.2.99.1'), '99.1');
  assert.equal(clientIdDoCookie('lixo'), null);
  assert.equal(sessionIdDoCookie('GS1.1.1700000123.3.1.1700000200.0.0.0'), '1700000123');
  assert.equal(sessionIdDoCookie('GS2.1.s1700000123$o3$g1$t1700000200$j0$l0$h0'), '1700000123');
  assert.equal(sessionIdDoCookie(''), null);
});

test('normalizar: sem consentimento não guarda nada identificável; com, só campos válidos', () => {
  const agora = new Date('2026-11-23T12:00:00Z');
  assert.deepEqual(normalizarAtribuicao({ consent: false, gclid: GCLID, client_id: '1.2' }, agora), { consent: false, em: agora.toISOString() });
  assert.equal(normalizarAtribuicao(null), null);
  const n = normalizarAtribuicao({ consent: true, client_id: '123.456', session_id: '1700000123', gclid: GCLID, gbraid: '<script>', utm_source: ' google ', lixo: 'x' }, agora);
  assert.deepEqual(n, { consent: true, em: agora.toISOString(), client_id: '123.456', session_id: '1700000123', gclid: GCLID, utm_source: 'google' });
});

test('payload do purchase: client_id e session_id reais com consentimento', () => {
  const atrib = { consent: true, client_id: '123.456', session_id: '1700000123', gclid: GCLID };
  const p = payloadPurchaseGA4({ transactionId: 987, value: 27, currency: 'brl', atribuicao: atrib, clientIdReserva: 'server.987', item: 'manual' });
  assert.equal(p.client_id, '123.456');
  assert.deepEqual(p.consent, { ad_user_data: 'GRANTED', ad_personalization: 'GRANTED' });
  assert.deepEqual(p.events[0].params, {
    transaction_id: '987', value: 27, currency: 'BRL', session_id: 1700000123, engagement_time_msec: 1, gclid: GCLID,
    items: [{ item_id: 'manual', item_name: 'manual', price: 27, quantity: 1 }],
  });
});

test('payload do purchase: sem consentimento ou sem dado, cai no client_id do servidor', () => {
  const negado = payloadPurchaseGA4({ transactionId: '1', value: 47, currency: 'BRL', atribuicao: { consent: false }, clientIdReserva: 'server.1' });
  assert.equal(negado.client_id, 'server.1');
  assert.deepEqual(negado.consent, { ad_user_data: 'DENIED', ad_personalization: 'DENIED' });
  assert.equal(negado.events[0].params.session_id, undefined);
  const antigo = payloadPurchaseGA4({ transactionId: '2', value: 27, currency: 'BRL', atribuicao: null, clientIdReserva: 'server.2' });
  assert.equal(antigo.client_id, 'server.2');
  assert.equal(antigo.consent, undefined); // análise antiga: comportamento de antes
});

test('CSV de conversões de cliques do Google Ads', () => {
  const csv = csvConversoesGoogleAds([
    { paid_at: '2026-11-23T15:30:00Z', valor_pago: 27, atribuicao: { consent: true, gclid: GCLID } },
    { paid_at: '2026-11-23T16:00:00Z', valor_pago: 47, atribuicao: { consent: false } },
    { paid_at: '2026-11-23T16:00:00Z', valor_pago: 47, atribuicao: null },
  ], 'Compra Manual');
  assert.equal(csv, `Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency\n"${GCLID}","Compra Manual","2026-11-23 12:30:00-0300","27","BRL"\n`);
});
