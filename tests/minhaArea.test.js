// Testes de lib/minhaArea.js e do código de 6 dígitos (lib/seuDiaServidor.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparProdutos, chavePessoa, chaveValida, precisaConfirmar, marcaConfirmacao, cartoesLeitura } from '../lib/minhaArea.js';

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

// ── Redesign da Minha Área: "Esta é você?" e cartões de leitura ─────────────
const linha = (x) => ({ ...base, email: 'eu@x.com', created_at: '2026-11-01', nome: 'Bia', data_nascimento: '1994-12-21', payment_status: 'pending', ...x });

test('precisaConfirmar: servidor, aparelho e perfil sem dados', () => {
  const p = { email: 'a@b.com', dataNascimento: '1994-12-21', hora: '07:25', cidade: { ibge: 3205309 }, confirmadoEm: null };
  assert.equal(precisaConfirmar(p), true);
  assert.equal(precisaConfirmar({ ...p, confirmadoEm: '2026-11-23T10:00:00Z' }), false);
  // sem a migração 0021 (campo ausente): vale a marca do aparelho
  const semColuna = { ...p };
  delete semColuna.confirmadoEm;
  assert.equal(precisaConfirmar(semColuna), true);
  assert.equal(precisaConfirmar(semColuna, marcaConfirmacao(p)), false);
  // dados mudaram depois de confirmar no aparelho: pergunta de novo
  assert.equal(precisaConfirmar({ ...semColuna, hora: '08:00' }, marcaConfirmacao(p)), true);
  // cadastro novo vai pra tela de dados, não pra confirmação
  assert.equal(precisaConfirmar({ ...p, precisaDados: true }), false);
  assert.equal(precisaConfirmar(null), false);
});

test('cartoesLeitura: ordem Manual, Compatibilidade, Previsão, Human Design + selos', () => {
  const [pago] = agruparProdutos([linha({ id: 'a', payment_status: 'paid' })], { email: 'eu@x.com' });
  const c = cartoesLeitura(pago);
  assert.deepEqual(c.map((x) => x.chave), ['manual', 'compat', 'previsao', 'human-design']);
  assert.deepEqual(c.map((x) => x.selo), ['Liberado', 'Liberado', 'Prova grátis', 'Prova grátis']);
  assert.equal(c[0].img, '/olho/e3.webp');
  assert.equal(c[2].acao, 'Mês atual grátis →');

  const [semManual] = agruparProdutos([linha({ id: 'b' })], { email: 'eu@x.com' });
  const m = cartoesLeitura(semManual)[0];
  assert.equal(m.selo, 'Prova grátis');
  assert.equal(m.acao, 'Ver prévia grátis →');
  assert.equal(m.href, '/resultado/b');
  assert.deepEqual(cartoesLeitura(null), []);
});

test('mapaDoPerfil: só o mapa da própria pessoa; o pago ganha, depois o mais recente', async () => {
  const { mapaDoPerfil } = await import('../lib/minhaArea.js');
  const rows = [
    { id: 'ana', nome: 'Ana', data_nascimento: '1995-09-03', payment_status: 'paid', created_at: '2026-11-20' },
    { id: 'velha', nome: 'Bianca P', data_nascimento: '1994-12-21', payment_status: 'pending', created_at: '2026-10-01' },
    { id: 'nova', nome: 'bianca', data_nascimento: '1994-12-21', payment_status: 'pending', created_at: '2026-11-10' },
  ];
  assert.deepEqual(mapaDoPerfil(rows, { dataNascimento: '1994-12-21', nome: 'Bianca' }), { id: 'nova', pago: false });
  const comPaga = [...rows, { id: 'paga', nome: 'Bianca', data_nascimento: '1994-12-21', payment_status: 'paid', created_at: '2026-09-01' }];
  assert.deepEqual(mapaDoPerfil(comPaga, { dataNascimento: '1994-12-21', nome: 'Bianca' }), { id: 'paga', pago: true });
  // mesma data, outro nome: não é dela
  assert.equal(mapaDoPerfil([{ id: 'x', nome: 'Carla', data_nascimento: '1994-12-21' }], { dataNascimento: '1994-12-21', nome: 'Bianca' }), null);
  assert.equal(mapaDoPerfil(rows, { dataNascimento: null }), null);
  assert.equal(mapaDoPerfil([], { dataNascimento: '1994-12-21' }), null);
});
