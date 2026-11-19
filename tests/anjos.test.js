// Testes de lib/anjos.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANJOS, anjoPorSlug, dadosDoAnjo, anjoPorLongitude, anjoDaHora, calcularAnjos, periodosDoAno, anjosDoMomento,
} from '../lib/anjos.js';
import { TEXTO_ANJO, TEXTO_CORO, BUSCA_CAMINHO } from '../lib/anjosTextos.js';

test('72 anjos com slugs únicos (os dois Lauviah numerados)', () => {
  assert.equal(ANJOS.length, 72);
  assert.equal(new Set(ANJOS.map((a) => a.slug)).size, 72);
  assert.equal(anjoPorSlug('lauviah-11').n, 11);
  assert.equal(anjoPorSlug('lauviah-17').n, 17);
  assert.equal(anjoPorSlug('nith-haiah').n, 25);
  assert.equal(anjoPorSlug('iah-hel').n, 62);
  assert.equal(anjoPorSlug('nao-existe'), null);
});

test('quinários: 5° por anjo, Vehuiah em 0° de Áries, Mumiah em 25°–30° de Peixes', () => {
  assert.equal(anjoPorLongitude(0), 1);
  assert.equal(anjoPorLongitude(4.999), 1);
  assert.equal(anjoPorLongitude(5), 2);
  assert.equal(anjoPorLongitude(359.99), 72);
  assert.equal(anjoPorLongitude(-0.01), 72);
});

test('hora: blocos de 20 min a partir da meia-noite', () => {
  assert.equal(anjoDaHora('00:00'), 1);
  assert.equal(anjoDaHora('00:19'), 1);
  assert.equal(anjoDaHora('00:20'), 2);
  assert.equal(anjoDaHora('07:25'), 23);
  assert.equal(anjoDaHora('23:59'), 72);
  assert.equal(anjoDaHora('24:00'), null);
  assert.equal(anjoDaHora(null), null);
});

test('dados fixos: coro, signo, carta, hora', () => {
  const v = dadosDoAnjo(1);
  assert.equal(v.coro.nome, 'Serafins');
  assert.equal(v.signo, 'Áries');
  assert.equal(v.carta, 'Dois de Paus');
  assert.equal(v.hora, '00:00–00:20');
  const n = dadosDoAnjo(54);
  assert.equal(n.nome, 'Nithael');
  assert.equal(n.coro.nome, 'Principados');
  assert.equal(n.signo, 'Sagitário');
  assert.equal(n.carta, 'Dez de Paus');
  const m = dadosDoAnjo(72);
  assert.equal(m.coro.arcanjo, 'Gabriel');
  assert.equal(m.carta, 'Dez de Copas');
  assert.equal(m.hora, '23:40–00:00');
  assert.equal(dadosDoAnjo(19).carta, 'Dois de Copas'); // Câncer, 1º decanato
});

test('Vitória, 21/12/1994 07:25 (horário de verão) → Nithael; mente Melahel', () => {
  const a = calcularAnjos({ data: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo' });
  assert.equal(a.guardiao, 54);
  assert.equal(a.mente, 23);
  assert.equal(a.signoSolar, 'Sagitário');
  assert.equal(a.dependeDaHora, false);
});

test('sem hora no dia da troca → avisa que depende da hora', () => {
  const a = calcularAnjos({ data: '2026-03-20' }); // equinócio 14:46 UTC
  assert.equal(a.dependeDaHora, true);
  assert.deepEqual(new Set([a.guardiao, a.alternativo]), new Set([72, 1]));
  const manha = calcularAnjos({ data: '2026-03-20', hora: '08:00' });
  const noite = calcularAnjos({ data: '2026-03-20', hora: '20:00' });
  assert.equal(manha.guardiao, 72);
  assert.equal(noite.guardiao, 1);
});

test('períodos de 2026 batem com as tabelas clássicas', () => {
  const p = periodosDoAno(2026);
  assert.equal(p.length, 72);
  for (const x of p) assert.ok(x.inicio && x.fim);
  assert.deepEqual(p[1], { inicio: '26/03', fim: '30/03' }); // Jeliel
  assert.deepEqual(p[53], { inicio: '17/12', fim: '21/12' }); // Nithael
  assert.equal(p[71].fim, '19/03'); // Mumiah
  assert.equal(p[56].inicio, '01/01'); // Nemamiah
});

test('momento: dia e hora válidos', () => {
  const m = anjosDoMomento(new Date('2026-11-19T16:52:00Z'), 'America/Sao_Paulo');
  assert.equal(m.horaLocal, '13:52');
  assert.equal(m.hora, 42);
  assert.ok(m.dia >= 1 && m.dia <= 72);
});

test('textos: 72 anjos completos e 9 coros', () => {
  for (let n = 1; n <= 72; n++) {
    const t = TEXTO_ANJO[n];
    assert.ok(t, `faltou o anjo ${n}`);
    for (const k of ['dom', 'essencia', 'sombra', 'pratica', 'mente']) assert.ok(t[k], `anjo ${n} sem ${k}`);
    assert.ok(Array.isArray(t.pedir) && t.pedir.length >= 2, `anjo ${n} sem pedir`);
    assert.ok(BUSCA_CAMINHO[n]?.[0] && BUSCA_CAMINHO[n]?.[1], `anjo ${n} sem busca/caminho`);
  }
  for (let n = 1; n <= 72; n++) assert.ok(TEXTO_CORO[dadosDoAnjo(n).coro.nome]);
});
