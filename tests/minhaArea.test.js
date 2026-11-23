// Testes de lib/minhaArea.js e do código de 6 dígitos (lib/seuDiaServidor.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparProdutos, chavePessoa, chaveValida } from '../lib/minhaArea.js';

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

test('suas x outras: mesmo primeiro nome E mesma data do perfil', () => {
  const rows = [
    { ...base, id: 'eu', created_at: '2026-10-01', nome: 'Bianca Pádua', data_nascimento: '1994-12-21', payment_status: 'paid' },
    { ...base, id: 'ana', created_at: '2026-11-15', nome: 'ANA Souza', data_nascimento: '1995-09-03', payment_status: 'paid' },
    // mesma data, outro nome (ex.: gêmea) → outra pessoa
    { ...base, id: 'gemea', created_at: '2026-11-01', nome: 'Beatriz', data_nascimento: '1994-12-21', payment_status: 'pending' },
  ];
  const p = agruparProdutos(rows, { email: 'bia@x.com', dataNascimentoPerfil: '1994-12-21', nomePerfil: 'bianca' });
  const por = Object.fromEntries(p.map((x) => [x.id, x]));
  assert.equal(por.eu.propria, true); // acento/caixa não importam
  assert.equal(por.ana.propria, false);
  assert.equal(por.ana.nome, 'ANA');
  assert.equal(por.ana.chave, 'ana|1995-09-03');
  assert.equal(por.gemea.propria, false);
  assert.equal(p[0].id, 'eu'); // as suas primeiro
  assert.ok(p.every((x) => x.oculta === false));
});

test('ocultas: só esconde leitura de outra pessoa, pela chave da pessoa', () => {
  const rows = [
    { ...base, id: 'eu', created_at: '2026-10-01', nome: 'Bianca', data_nascimento: '1994-12-21', payment_status: 'paid' },
    { ...base, id: 'ana', created_at: '2026-11-15', nome: 'Ana', data_nascimento: '1995-09-03', payment_status: 'paid' },
  ];
  const ctx = { email: 'bia@x.com', dataNascimentoPerfil: '1994-12-21', nomePerfil: 'Bianca' };
  const p = agruparProdutos(rows, { ...ctx, ocultas: ['ana|1995-09-03', 'bianca|1994-12-21'] });
  const por = Object.fromEntries(p.map((x) => [x.id, x]));
  assert.equal(por.ana.oculta, true);
  assert.equal(por.eu.oculta, false); // a própria nunca fica oculta
  // refez a leitura de Ana: continua oculta (chave = pessoa, não análise)
  const p2 = agruparProdutos([...rows, { ...base, id: 'ana2', created_at: '2026-11-20', nome: 'Ana Maria', data_nascimento: '1995-09-03', payment_status: 'paid' }],
    { ...ctx, ocultas: ['ana|1995-09-03'] });
  assert.ok(p2.filter((x) => x.chave === 'ana|1995-09-03').every((x) => x.oculta));
});

test('sem data no perfil: ninguém é rotulado como outra pessoa', () => {
  const rows = [{ ...base, id: 'ana', created_at: '2026-11-15', nome: 'Ana', data_nascimento: '1995-09-03', payment_status: 'paid' }];
  const p = agruparProdutos(rows, { email: 'bia@x.com', ocultas: ['ana|1995-09-03'] });
  assert.equal(p[0].propria, true);
  assert.equal(p[0].oculta, false);
});

test('chaveValida', () => {
  assert.equal(chaveValida(chavePessoa('Ana-Clara Souza', '1995-09-03')), true);
  assert.equal(chaveValida(chavePessoa("D'Ávila", '1990-01-01')), true);
  assert.equal(chaveValida('|1995-09-03'), true); // sem nome
  assert.equal(chaveValida('ana'), false);
  assert.equal(chaveValida('ana|ontem'), false);
  assert.equal(chaveValida('a|b|1995-09-03'), false);
  assert.equal(chaveValida('x'.repeat(70) + '|1995-09-03'), false);
  assert.equal(chaveValida(null), false);
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
