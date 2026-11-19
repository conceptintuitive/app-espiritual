// Testes de lib/minhaArea.js e do código de 6 dígitos (lib/seuDiaServidor.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparProdutos } from '../lib/minhaArea.js';

process.env.SEU_DIA_SECRET = 'teste-segredo';
const { gerarCodigo, hashCodigo, checarCodigo, CODIGO_MAX_TENTATIVAS } = await import('../lib/seuDiaServidor.js');

const base = { email: 'bia@x.com', tier2_payment_status: null, hd_payment_status: null, compat_payment_status: null };

test('refez o quiz pra si: aparece uma vez, a paga', () => {
  const rows = [
    { ...base, id: 'b', created_at: '2026-11-10', nome: 'Bianca Padua', data_nascimento: '1994-12-21', payment_status: 'pending' },
    { ...base, id: 'a', created_at: '2026-10-01', nome: 'bianca', data_nascimento: '1994-12-21', payment_status: 'paid' },
    { ...base, id: 'c', created_at: '2026-11-15', nome: 'Namorado', data_nascimento: '1992-04-03', payment_status: 'pending' },
  ];
  const p = agruparProdutos(rows, { email: 'bia@x.com', dataNascimentoPerfil: '1994-12-21' });
  assert.equal(p.length, 2);
  assert.equal(p[0].id, 'a'); // a própria pessoa primeiro
  assert.equal(p[0].itens[0].href, '/manual/a');
  assert.equal(p[0].itens[3].rotulo, 'Grátis com o Manual');
  assert.equal(p[1].nome, 'Namorado');
  assert.equal(p[1].itens[0].estado, 'travado');
  assert.equal(p[1].itens[0].href, '/resultado/c');
  assert.equal(p[1].itens[1].estado, 'parcial');
});

test('assinatura abre os extras; presente recebido aparece com quem deu', () => {
  const rows = [{ ...base, id: 'g', email: 'mae@x.com', presente_email: 'BIA@x.com', presente_de: 'Mãe', created_at: '2026-09-01', nome: 'Bianca', data_nascimento: '1994-12-21', payment_status: 'paid' }];
  const p = agruparProdutos(rows, { email: 'bia@x.com', assinaturaAtiva: true });
  assert.equal(p[0].presenteDe, 'Mãe');
  assert.equal(p[0].itens[1].rotulo, 'Incluso na assinatura');
  assert.equal(p[0].itens[2].estado, 'aberto');
});

test('código: certo, errado, vencido, bloqueado, uso de outro e-mail', () => {
  const c = gerarCodigo();
  assert.match(c, /^\d{6}$/);
  const row = { codigo_hash: hashCodigo('bia@x.com', c), codigo_expira: new Date(Date.now() + 60000).toISOString(), codigo_tentativas: 0 };
  assert.equal(checarCodigo(row, 'bia@x.com', c), 'ok');
  const errado = c === '000000' ? '000001' : '000000';
  assert.equal(checarCodigo(row, 'bia@x.com', errado), 'errado');
  assert.equal(checarCodigo(row, 'outra@x.com', c), 'errado');
  assert.equal(checarCodigo({ ...row, codigo_expira: new Date(Date.now() - 1).toISOString() }, 'bia@x.com', c), 'vencido');
  assert.equal(checarCodigo({ ...row, codigo_tentativas: CODIGO_MAX_TENTATIVAS }, 'bia@x.com', c), 'bloqueado');
  assert.equal(checarCodigo(null, 'bia@x.com', c), 'sem');
  assert.equal(checarCodigo(row, 'bia@x.com', 'abc'), 'errado');
});
