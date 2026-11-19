// Testes de lib/assinaturaRegras.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLANOS, refAssinatura, idDaRef, estenderAcesso, acessoDoCartao, statusDoCartao, resumoAcesso, DIAS_CORTESIA_MANUAL,
} from '../lib/assinaturaRegras.js';

const DIA = 86400 * 1000;
const T0 = Date.UTC(2026, 10, 19, 12, 0);
const iso = (ms) => new Date(ms).toISOString();

test('planos: mensal R$19,90 e anual R$149', () => {
  assert.equal(PLANOS.mensal.preco, 19.9);
  assert.equal(PLANOS.anual.preco, 149);
  assert.deepEqual(PLANOS.anual.recorrencia, { frequency: 12, frequency_type: 'months' });
});

test('external_reference: ida e volta, e recusa o que não é assinatura', () => {
  const id = '3f2b8c1e-1234-4abc-9def-0123456789ab';
  assert.equal(idDaRef(refAssinatura(id)), id);
  assert.equal(idDaRef(id), null); // análise do Manual (uuid puro) não é assinatura
  assert.equal(idDaRef(`${id}__upsell`), null);
  assert.equal(idDaRef('assin__lixo'), null);
});

test('pré-pago: estende a partir de agora, ou do vencimento se ainda vale', () => {
  assert.equal(estenderAcesso(null, 31, T0).getTime(), T0 + 31 * DIA);
  assert.equal(estenderAcesso(iso(T0 - 5 * DIA), 31, T0).getTime(), T0 + 31 * DIA); // vencido: conta de hoje
  assert.equal(estenderAcesso(iso(T0 + 10 * DIA), 31, T0).getTime(), T0 + 41 * DIA); // renovou antes: soma
});

test('cartão: autorizado vale até a próxima cobrança + 3 dias; cancelado mantém o já pago', () => {
  const prox = iso(T0 + 30 * DIA);
  assert.equal(acessoDoCartao({ status: 'authorized', nextPaymentDate: prox, plano: 'mensal', acessoAteAtual: null, agora: T0 }).getTime(), T0 + 33 * DIA);
  const pago = iso(T0 + 20 * DIA);
  assert.equal(acessoDoCartao({ status: 'cancelled', nextPaymentDate: prox, plano: 'mensal', acessoAteAtual: pago, agora: T0 }).toISOString(), pago);
  assert.equal(acessoDoCartao({ status: 'pending', plano: 'mensal', acessoAteAtual: null, agora: T0 }), null);
  // Nunca diminui
  const longe = iso(T0 + 300 * DIA);
  assert.equal(acessoDoCartao({ status: 'authorized', nextPaymentDate: prox, plano: 'mensal', acessoAteAtual: longe, agora: T0 }).toISOString(), longe);
  assert.equal(statusDoCartao('authorized'), 'ativa');
  assert.equal(statusDoCartao('cancelled'), 'cancelada');
  assert.equal(statusDoCartao('pending'), 'pendente');
});

test('acesso: assinatura ativa ganha; anual inclui o Manual; vencida não vale', () => {
  const r = resumoAcesso({
    linhas: [
      { plano: 'mensal', metodo: 'prepago', status: 'ativa', acesso_ate: iso(T0 + 5 * DIA) },
      { plano: 'anual', metodo: 'recorrente', status: 'ativa', acesso_ate: iso(T0 + 200 * DIA) },
      { plano: 'mensal', metodo: 'prepago', status: 'expirada', acesso_ate: iso(T0 - 1 * DIA) },
    ],
    agora: T0,
  });
  assert.equal(r.ativa, true);
  assert.equal(r.plano, 'anual');
  assert.equal(r.incluiManual, true);
  assert.equal(r.renovaSozinha, true);
  assert.equal(r.acessoAte, iso(T0 + 200 * DIA));

  const vencida = resumoAcesso({ linhas: [{ plano: 'anual', metodo: 'prepago', status: 'ativa', acesso_ate: iso(T0 - DIA) }], agora: T0 });
  assert.equal(vencida.ativa, false);
});

test('Manual: 1º mês de cortesia a partir do pagamento', () => {
  const dentro = resumoAcesso({ manualPagoEm: iso(T0 - 10 * DIA), agora: T0 });
  assert.equal(dentro.ativa, true);
  assert.equal(dentro.origem, 'manual');
  assert.equal(dentro.acessoAte, iso(T0 + (DIAS_CORTESIA_MANUAL - 10) * DIA));
  const fora = resumoAcesso({ manualPagoEm: iso(T0 - 40 * DIA), agora: T0 });
  assert.equal(fora.ativa, false);
});
