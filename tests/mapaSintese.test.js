// Testes de lib/mapaSintese.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sistemasDaPessoa, sinteseDoMapa, destaqueDoMapa, nomesDosSistemas, TEMAS, TENSOES } from '../lib/mapaSintese.js';

test('Vitória, 21/12/1994 07:25: sistemas, temas repetidos e tensão', () => {
  const s = sistemasDaPessoa({ dataNascimento: '1994-12-21', hora: '07:25' });
  const por = Object.fromEntries(s.map((x) => [x.chave, x]));
  assert.equal(por.signos.valor, 'Sagitário');
  assert.equal(por.numerologia.valor, '11');
  assert.equal(por['astrologia-chinesa'].valor, 'Cachorro de Madeira');
  assert.equal(por.anjo.valor, 'Nithael');
  assert.equal(por['anjo-mente'].valor, 'Melahel');
  assert.equal(por['kin-maia'].valor, 'Terra Ressonante Vermelha');
  const sin = sinteseDoMapa(s);
  assert.deepEqual(sin.repete.map((r) => r.tema), ['construir', 'intuir']);
  assert.equal(sin.tensao.a, 'liberdade');
  assert.equal(sin.tensao.b, 'construir');
});

test('sem hora: sem anjo da mente, síntese continua funcionando', () => {
  const s = sistemasDaPessoa({ dataNascimento: '1990-05-01' });
  assert.equal(s.some((x) => x.chave === 'anjo-mente'), false);
  const sin = sinteseDoMapa(s);
  assert.ok(Array.isArray(sin.repete));
  assert.ok(sin.ranking.length > 0);
});

test('todo tema usado existe; tensões apontam pra temas válidos', () => {
  for (let ano = 1950; ano <= 2010; ano += 7) {
    for (const md of ['01-15', '04-02', '07-30', '10-11', '12-25']) {
      for (const sis of sistemasDaPessoa({ dataNascimento: `${ano}-${md}`, hora: '13:10' })) {
        for (const t of sis.temas) assert.ok(TEMAS[t], `tema ${t} de ${sis.chave}`);
      }
    }
  }
  for (const t of TENSOES) { assert.ok(TEMAS[t.a]); assert.ok(TEMAS[t.b]); }
});

test('frases em primeira pessoa (card do story): todo tema e toda tensão têm `eu`', async () => {
  const { TEMAS, TENSOES, sistemasDaPessoa, sinteseDoMapa } = await import('../lib/mapaSintese.js');
  for (const [k, t] of Object.entries(TEMAS)) assert.match(t.eu, /^(Eu|Minha|Uma)/, k);
  for (const t of TENSOES) assert.ok(t.eu && t.eu.length < 80, `${t.a}×${t.b}`);
  const s = sinteseDoMapa(sistemasDaPessoa({ dataNascimento: '1994-12-21', hora: '07:25' }));
  assert.equal(s.tensao.eu, 'Uma parte de mim quer raiz. A outra quer estrada.');
  assert.ok(s.repete.every((r) => r.eu));
});

test('tensão dividida em frase (aberta) e conselho (do Manual); texto = os dois', async () => {
  const { TENSOES, sistemasDaPessoa, sinteseDoMapa } = await import('../lib/mapaSintese.js');
  for (const t of TENSOES) {
    assert.ok(t.frase && t.conselho, `${t.a}×${t.b}`);
    assert.equal(t.texto, `${t.frase} ${t.conselho}`);
  }
  const s = sinteseDoMapa(sistemasDaPessoa({ dataNascimento: '1994-12-21', hora: '07:25' }));
  assert.equal(s.tensao.frase, 'Uma parte de você quer raiz e estabilidade; outra quer estrada.');
  assert.match(s.tensao.conselho, /^O equilíbrio é/);
});

test('previaDoManual: títulos com os temas da pessoa (sem IA)', async () => {
  const { previaDoManual, sistemasDaPessoa, sinteseDoMapa, TEMAS } = await import('../lib/mapaSintese.js');
  const s = sinteseDoMapa(sistemasDaPessoa({ dataNascimento: '1994-12-21', hora: '07:25' }));
  const p = previaDoManual(s);
  assert.deepEqual(p.map((x) => x.titulo), [
    'Por que você se divide entre Liberdade e Construir, e como parar de escolher',
    'Seu jeito de amar como alguém que veio pra Construir',
    'Onde a Intuição te faz ganhar (e perder) dinheiro',
  ]);
  // sem tensão: o tema que mais se repete; "Verdade e ordem" vira "Ordem"
  const p2 = previaDoManual({ repete: [{ tema: 'ordem' }], ranking: [{ tema: 'ordem' }], tensao: null });
  assert.equal(p2[0].titulo, 'Por que seu mapa repete Ordem, e o que fazer com isso');
  assert.equal(p2[2].titulo, 'Onde a busca por Ordem te faz ganhar (e perder) dinheiro');
  // todo tema tem frase de amor e de dinheiro
  for (const t of Object.keys(TEMAS)) {
    const q = previaDoManual({ repete: [{ tema: t }], ranking: [{ tema: t }], tensao: null });
    assert.ok(q.every((x) => x.titulo && !x.titulo.includes('undefined')), t);
  }
});

// ── Regra do Sol + destaque do /resultado ───────────────────────────────────
const destaque = (dataNascimento, hora = null) => destaqueDoMapa(sistemasDaPessoa({ dataNascimento, hora }));
const sintese = (dataNascimento, hora = null) => sinteseDoMapa(sistemasDaPessoa({ dataNascimento, hora }));

test('são sempre 5 sistemas (os dois anjos contam como um)', () => {
  assert.equal(destaque('1994-12-21', '07:25').total, 5);
  assert.equal(destaque('1994-12-21').total, 5);
});

test('regra do Sol: signo + anjo da guarda valem um voto; o anjo da guarda sai da lista', () => {
  // Só os dois repetem: não é convergência, fica a tensão.
  assert.deepEqual(sintese('1980-01-01').repete, []);
  assert.ok(destaque('1980-01-01').tensao);
  // Signo + anjo da guarda + número = 2 votos, e a lista mostra só os independentes.
  const liderar = sintese('1980-01-03').repete.find((r) => r.tema === 'liderar');
  assert.equal(liderar.votos, 2);
  assert.deepEqual(liderar.sistemas, ['Signo solar', 'Número de vida']);
  // Signo + anjo da MENTE (pela hora) vale.
  const mente = destaque('1980-01-01', '14:10').convergencia;
  assert.equal(mente.rotulo, 'Seu signo e seu anjo concordam');
  assert.deepEqual(mente.quem.map((q) => q.sistema), ['Signo solar', 'Anjo da mente']);
  // Os dois anjos sozinhos são um sistema só: não repetem.
  assert.ok(!sintese('1980-03-30', '14:10').repete.some((r) => r.tema === 'construir'));
});

test('destaque: com 2 sistemas nomeia; com 3 ou mais, conta', () => {
  const dois = destaque('1980-02-22').convergencia;
  assert.equal(dois.tema, 'cuidar');
  assert.equal(dois.rotulo, 'Seu signo e seu número concordam');
  assert.equal(dois.rotuloEu, 'Meu signo e meu número concordam');
  const tres = destaque('1980-01-04').convergencia;
  assert.equal(tres.tema, 'liderar');
  assert.equal(tres.rotulo, '3 dos seus 5 sistemas repetem');
  assert.equal(tres.rotuloEu, '3 dos meus 5 sistemas repetem');
  assert.equal(tres.quem.length, 3);
  // Signo + anjo da guarda + número: nomeia os dois independentes.
  assert.equal(destaque('1980-01-03').convergencia.rotulo, 'Seu signo e seu número concordam');
});

test('em 1955–2007 a síntese segue a regra e o destaque nunca sai vazio', () => {
  for (const hora of [null, '14:10']) {
    for (let t = Date.UTC(1955, 0, 1); t < Date.UTC(2008, 0, 1); t += 86400e3 * 9) {
      const d = new Date(t).toISOString().slice(0, 10);
      const s = sintese(d, hora);
      for (const r of s.repete) {
        assert.ok(r.votos >= 2 && r.familias.length === r.votos, d);
        assert.ok(!(r.sistemas.includes('Signo solar') && r.sistemas.includes('Anjo da guarda')), `${d}: signo e anjo da guarda juntos`);
      }
      if (s.tensao) for (const lado of [s.tensao.sistemasA, s.tensao.sistemasB]) assert.ok(!(lado.includes('Signo solar') && lado.includes('Anjo da guarda')), d);
      const x = destaque(d, hora);
      assert.ok(x.convergencia || x.tensao, d);
    }
  }
  const metal = destaque('1994-12-21', '07:25').convergencia.quem.find((q) => q.sistema === 'Astrologia chinesa');
  assert.equal(metal.valor, 'Metal Yin');
});

test('nomesDosSistemas: os dois anjos viram um item na lista', () => {
  assert.deepEqual(nomesDosSistemas(['Número de vida', 'Anjo da guarda', 'Anjo da mente']), ['Número de vida', 'Anjo da guarda e da mente']);
  assert.deepEqual(nomesDosSistemas(['Signo solar', 'Anjo da mente']), ['Signo solar', 'Anjo da mente']);
});
