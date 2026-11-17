// Planetas e Human Design com o fuso real (análises novas) x legado (antigas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPlanetas, calcularCorposCelestesParaHumanDesign as corposHD } from '../lib/calculos.js';
import { utcOffsetHoras, offsetSalvo } from '../lib/sky.js';

test('sem offset = comportamento legado (registros antigos não mudam)', () => {
  for (const [d, h] of [['1990-01-11', '20:30'], ['1994-12-21', '07:25'], ['2001-07-04', null]]) {
    assert.deepEqual(calcularPlanetas(d, h), calcularPlanetas(d, h, null), `${d} ${h}`);
    assert.deepEqual(corposHD(d, h), corposHD(d, h, -3), `HD ${d} ${h}`);
  }
});

test('Lua com fuso real muda de signo perto da cúspide', () => {
  const casos = [
    ['1990-01-11', '20:30', 'Câncer', 'Leão'],   // verão (-2)
    ['1990-02-03', '20:30', 'Touro', 'Gêmeos'],  // verão (-2)
    ['1990-02-12', '20:30', 'Virgem', 'Libra'],  // -3 (verão já tinha acabado)
  ];
  for (const [d, h, antes, depois] of casos) {
    const off = utcOffsetHoras({ data: d, hora: h, tz: 'America/Sao_Paulo' });
    assert.equal(calcularPlanetas(d, h).signoLua, antes, `legado ${d}`);
    assert.equal(calcularPlanetas(d, h, off).signoLua, depois, `fuso real ${d}`);
  }
});

test('sem hora o offset é ignorado (meio-dia, igual ao legado)', () => {
  assert.deepEqual(calcularPlanetas('1990-01-11', null, -2), calcularPlanetas('1990-01-11', null));
});

test('Human Design: offset real desloca a Lua na direção certa', () => {
  // Vitória, dez/1994, horário de verão: -2 em vez de -3 → 1h mais cedo em UTC
  const legado = corposHD('1994-12-21', '07:25');
  const real = corposHD('1994-12-21', '07:25', -2);
  const delta = legado.personalidade.lua - real.personalidade.lua;
  assert.ok(delta > 0.4 && delta < 0.7, `Lua ~0,5°/h mais atrás com -2 (delta=${delta.toFixed(3)})`);
});

test('offsetSalvo valida o que vem do banco', () => {
  assert.equal(offsetSalvo({ utc_offset_nascimento: -2 }), -2);
  assert.equal(offsetSalvo({ utc_offset_nascimento: '-3.00' }), -3); // numeric pode vir como string
  assert.equal(offsetSalvo({ utc_offset_nascimento: null }), null);
  assert.equal(offsetSalvo({}), null);
  assert.equal(offsetSalvo(null), null);
  assert.equal(offsetSalvo({ utc_offset_nascimento: 5 }), null); // fora do Brasil/absurdo
  assert.equal(offsetSalvo({ utc_offset_nascimento: 'abc' }), null);
});
