// Testes de lib/pixManual.js (Pix do Manual na página) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bonusDoPedido, valorDaCompra, chaveValida, expiracaoPix, corpoPagamentoPix, respostaPix, criarPix,
} from '../lib/pixManual.js';
import { PRECO_BONUS_AVULSO, PRECO_BONUS_COMBO, PRECO_MANUAL_JANELA } from '../lib/preco.js';

test('bônus e valor: mesma regra do checkout de cartão', () => {
  assert.deepEqual(bonusDoPedido({ incluirTier2: true }), ['projecao12m', 'humandesign']);
  assert.deepEqual(bonusDoPedido({ bonusProdutos: ['humandesign', 'xx', 'humandesign'] }), ['humandesign']);
  assert.deepEqual(bonusDoPedido({}), []);
  assert.equal(valorDaCompra(27, []), 27);
  assert.equal(valorDaCompra(27, ['humandesign']), 27 + PRECO_BONUS_AVULSO);
  assert.equal(valorDaCompra(27, ['projecao12m', 'humandesign']), 27 + PRECO_BONUS_COMBO);
});

test('chave de idempotência: só letras, números e hífen, 16 a 64', () => {
  assert.ok(chaveValida('3f2a9c1e-4b5d-4e6f-8a7b-9c0d1e2f3a4b'));
  assert.ok(!chaveValida('curta'));
  assert.ok(!chaveValida('tem espaço e acento ção 1234567890'));
  assert.ok(!chaveValida(null));
});

test('expiração: 30 min depois, no fuso de Brasília', () => {
  assert.equal(expiracaoPix(Date.parse('2026-11-24T20:00:00Z')), '2026-11-24T17:30:00.000-03:00');
  assert.equal(Date.parse(expiracaoPix(Date.parse('2026-11-24T20:00:00Z'))), Date.parse('2026-11-24T20:30:00Z'));
});

test('corpo do pagamento: mesma referência e metadata que o webhook já entende', () => {
  const c = corpoPagamentoPix({
    analise: { id: 'id-1', nome: 'Mariana Souza' }, email: 'm@x.com', precoManual: PRECO_MANUAL_JANELA,
    bonus: ['projecao12m', 'humandesign'], baseUrl: 'https://site', agora: Date.parse('2026-11-24T20:00:00Z'),
  });
  assert.equal(c.payment_method_id, 'pix');
  assert.equal(c.external_reference, 'id-1');
  assert.equal(c.notification_url, 'https://site/api/webhook-mp');
  assert.equal(c.transaction_amount, PRECO_MANUAL_JANELA + PRECO_BONUS_COMBO);
  assert.deepEqual({ t: c.metadata.includes_tier2, h: c.metadata.includes_hd }, { t: true, h: true });
  assert.deepEqual(c.payer, { email: 'm@x.com', first_name: 'Mariana' });
  assert.match(c.description, /Manual do seu Mapa \+ Previsão do Ano \+ Human Design/);
});

const pagamentoMP = { id: 987, status: 'pending', transaction_amount: 27, date_of_expiration: '2026-11-24T17:30:00.000-03:00',
  point_of_interaction: { transaction_data: { qr_code: '000201…', qr_code_base64: 'iVBOR…' } } };

test('resposta pro navegador: id, copia-e-cola, QR e expiração', () => {
  assert.deepEqual(respostaPix(pagamentoMP), { paymentId: '987', status: 'pending', qrCode: '000201…', qrCodeBase64: 'iVBOR…', expiraEm: '2026-11-24T17:30:00.000-03:00', valor: 27 });
  assert.equal(respostaPix({ id: 1 }), null);
});

test('criarPix: manda a chave de idempotência e o token; erro do MP vira exceção', async () => {
  const chamadas = [];
  const ok = await criarPix({ token: 'TOK', corpo: { a: 1 }, chave: 'chave-de-teste-123456', fetchFn: async (url, o) => {
    chamadas.push({ url, o });
    return { ok: true, json: async () => pagamentoMP };
  } });
  assert.equal(ok.paymentId, '987');
  assert.equal(chamadas[0].url, 'https://api.mercadopago.com/v1/payments');
  assert.equal(chamadas[0].o.headers['X-Idempotency-Key'], 'chave-de-teste-123456');
  assert.equal(chamadas[0].o.headers.Authorization, 'Bearer TOK');
  await assert.rejects(
    criarPix({ token: 'T', corpo: {}, chave: 'k'.repeat(20), fetchFn: async () => ({ ok: false, status: 400, json: async () => ({ message: 'Collector user without key enabled for QR render' }) }) }),
    /Collector user without key/,
  );
});
