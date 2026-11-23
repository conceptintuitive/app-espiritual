// Testes de lib/testeSeuDia.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diaDoTeste, fimDoTeste, diasRestantes, textoTeste, dataBrasilia } from '../lib/testeSeuDia.js';

const inicio = '2026-11-23T23:30:00Z'; // 20h30 de 23/11 em Brasília (dia 1)

test('dia 1 é o dia em que salvou, no relógio de Brasília', () => {
  assert.equal(dataBrasilia(inicio), '2026-11-23');
  assert.equal(diaDoTeste(inicio, Date.parse('2026-11-24T01:00:00Z')), 1); // 22h do mesmo dia
  assert.equal(diaDoTeste(inicio, Date.parse('2026-11-27T10:00:00Z')), 5);
  assert.equal(diaDoTeste(null), null);
});

test('acaba no fim do dia 7 (00:00 do dia 8, Brasília)', () => {
  assert.equal(new Date(fimDoTeste(inicio)).toISOString(), '2026-11-30T03:00:00.000Z');
});

test('faltam N dias depois de hoje: dia 5 → 2, dia 7 → último', () => {
  const dia = (n) => Date.parse(`2026-11-${String(22 + n).padStart(2, '0')}T10:00:00Z`);
  assert.equal(diasRestantes(inicio, dia(1)), 6);
  assert.equal(diasRestantes(inicio, dia(5)), 2);
  assert.equal(diasRestantes(inicio, dia(7)), 0);
  assert.equal(diasRestantes(inicio, dia(8)), null);
  assert.equal(textoTeste(2), 'Seu Dia Completo grátis: faltam 2 dias.');
  assert.equal(textoTeste(1), 'Seu Dia Completo grátis: falta 1 dia.');
  assert.equal(textoTeste(0), 'Seu Dia Completo grátis: hoje é o último dia.');
  assert.equal(textoTeste(null), '');
});
