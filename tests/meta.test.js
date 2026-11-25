// Testes dos eventos da Meta Conversions API (lib/meta.js) e do fbc/fbp
// (lib/atribuicao.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { payloadEventoMeta, idDoTeste, sendMetaLead, sendMetaStartTrial } from '../lib/meta.js';
import { cliquesDaUrl, fbcDoClique, cookiesMeta, normalizarAtribuicao, payloadPurchaseGA4 } from '../lib/atribuicao.js';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const FBCLID = 'IwAR2xYz_abc-DEF123';
const FBC = `fb.1.1764000000000.${FBCLID}`;
const FBP = 'fb.1.1764000000000.1234567890';

test('payload: hash de e-mail/telefone, IP e navegador; fbc/fbp só com aceite; sem test_event_code por padrão', () => {
  const comAceite = payloadEventoMeta({
    nome: 'Lead', eventId: 'lead-abc', sourceUrl: 'https://intuitiveconcept.com.br/resultado/abc',
    email: ' Ana@Exemplo.com ', phone: '(27) 99999-1234', clientIp: '1.2.3.4', userAgent: 'UA',
    atribuicao: { consent: true, fbc: FBC, fbp: FBP }, agora: 1764000000123, testCode: '',
  });
  const ev = comAceite.data[0];
  assert.equal(ev.event_name, 'Lead');
  assert.equal(ev.event_id, 'lead-abc');
  assert.equal(ev.event_time, 1764000000);
  assert.equal(ev.action_source, 'website');
  assert.deepEqual(ev.user_data, {
    em: [sha('ana@exemplo.com')], ph: [sha('5527999991234')], client_ip_address: '1.2.3.4', client_user_agent: 'UA', fbc: FBC, fbp: FBP,
  });
  assert.equal(comAceite.test_event_code, undefined);
  // sem aceite (ou com valor fora do formato): nada de fbc/fbp
  const semAceite = payloadEventoMeta({ nome: 'Lead', eventId: 'x', sourceUrl: 's', email: 'a@b.co', atribuicao: { consent: false, fbc: FBC, fbp: FBP }, testCode: '' });
  assert.equal(semAceite.data[0].user_data.fbc, undefined);
  assert.equal(semAceite.data[0].user_data.fbp, undefined);
  const lixo = payloadEventoMeta({ nome: 'Lead', eventId: 'x', sourceUrl: 's', atribuicao: { consent: true, fbc: '<script>', fbp: 'fb.1.x' }, testCode: '' });
  assert.deepEqual(lixo.data[0].user_data, {});
});

test('META_TEST_EVENT_CODE: com o código, o evento vai pra aba "Testar eventos"', () => {
  assert.equal(payloadEventoMeta({ nome: 'Lead', eventId: 'x', sourceUrl: 's', testCode: ' TEST123 ' }).test_event_code, 'TEST123');
});

test('StartTrial: mesmo event_id pra mesma pessoa (a Meta descarta o repetido)', () => {
  assert.equal(idDoTeste(' Ana@Exemplo.com'), idDoTeste('ana@exemplo.com'));
  assert.notEqual(idDoTeste('ana@exemplo.com'), idDoTeste('bia@exemplo.com'));
  assert.match(idDoTeste('ana@exemplo.com'), /^trial-[0-9a-f]{24}$/);
});

test('envio: Lead com event_id "lead-<id>" (o mesmo do Pixel) e StartTrial com custom_data, no pixel certo', async () => {
  const enviados = [];
  const fetchAntes = globalThis.fetch;
  const tokenAntes = process.env.META_ACCESS_TOKEN;
  const codigoAntes = process.env.META_TEST_EVENT_CODE;
  process.env.META_ACCESS_TOKEN = 'token-falso';
  process.env.META_TEST_EVENT_CODE = 'TEST999';
  globalThis.fetch = async (url, init) => { enviados.push({ url: String(url), corpo: JSON.parse(init.body) }); return { ok: true, json: async () => ({ events_received: 1 }) }; };
  const log = console.log;
  console.log = () => {};
  try {
    await sendMetaLead({ email: 'ana@exemplo.com', analiseId: 'abc', clientIp: '1.2.3.4', userAgent: 'UA', atribuicao: { consent: true, fbc: FBC } });
    await sendMetaStartTrial({ email: 'ana@exemplo.com', origem: 'quiz', atribuicao: { consent: true, fbp: FBP } });
    await sendMetaStartTrial({ email: '', origem: 'quiz' });
  } finally {
    globalThis.fetch = fetchAntes;
    console.log = log;
    if (tokenAntes === undefined) delete process.env.META_ACCESS_TOKEN; else process.env.META_ACCESS_TOKEN = tokenAntes;
    if (codigoAntes === undefined) delete process.env.META_TEST_EVENT_CODE; else process.env.META_TEST_EVENT_CODE = codigoAntes;
  }
  assert.equal(enviados.length, 2, 'sem e-mail, sem StartTrial');
  assert.match(enviados[0].url, /graph\.facebook\.com\/v21\.0\/1012756614970977\/events/);
  assert.equal(enviados[0].corpo.data[0].event_id, 'lead-abc');
  assert.equal(enviados[0].corpo.data[0].user_data.fbc, FBC);
  assert.equal(enviados[0].corpo.test_event_code, 'TEST999');
  const trial = enviados[1].corpo.data[0];
  assert.equal(trial.event_name, 'StartTrial');
  assert.equal(trial.event_id, idDoTeste('ana@exemplo.com'));
  assert.equal(trial.custom_data.currency, 'BRL');
  assert.equal(trial.custom_data.content_category, 'quiz');
  assert.equal(trial.user_data.fbp, FBP);
});

test('fbclid: guardado na entrada, vira fbc; fica na análise só com aceite; nunca vai pro GA4', () => {
  const c = cliquesDaUrl(`?fbclid=${FBCLID}&utm_source=facebook`);
  assert.equal(c.fbclid, FBCLID);
  assert.equal(fbcDoClique(FBCLID, 1764000000000), FBC);
  assert.equal(fbcDoClique('curto', 1764000000000), null);
  assert.equal(fbcDoClique(FBCLID, undefined), null);
  const agora = new Date('2026-11-25T12:00:00Z');
  const com = normalizarAtribuicao({ consent: true, fbc: FBC, fbp: FBP, utm_source: 'facebook' }, agora);
  assert.equal(com.fbc, FBC);
  assert.equal(com.fbp, FBP);
  const sem = normalizarAtribuicao({ consent: false, fbc: FBC, fbp: FBP, utm_source: 'facebook' }, agora);
  assert.equal(sem.fbc, undefined);
  assert.equal(sem.fbp, undefined);
  assert.deepEqual(cookiesMeta(com), { fbc: FBC, fbp: FBP });
  assert.deepEqual(cookiesMeta(sem), {});
  assert.deepEqual(cookiesMeta(null), {});
  const ga4 = payloadPurchaseGA4({ transactionId: '1', value: 27, currency: 'BRL', atribuicao: { ...com, fbclid: FBCLID }, clientIdReserva: 'server.1' });
  assert.ok(!JSON.stringify(ga4).includes('fb.1'), 'fbc/fbp não vão pro Google');
  assert.ok(!JSON.stringify(ga4).includes(FBCLID), 'fbclid não vai pro Google');
});
