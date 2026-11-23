// Testes de lib/mapaSintese.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sistemasDaPessoa, sinteseDoMapa, TEMAS, TENSOES } from '../lib/mapaSintese.js';

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
