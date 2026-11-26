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

// Referência: PyEphem (VSOP87/ELP), longitude eclíptica da data, hora de Brasília (UTC−3).
test('Vênus, Marte e Plutão batem com a efeméride (antes: Vênus até 50° fora)', async () => {
  const { calcularCorposCelestesParaHumanDesign, calcularPlanetas } = await import('../lib/calculos.js');
  const casos = [
    ['1942-01-19', '22:48', { venus: 320.16, marte: 34.11, plutao: 124.75 }, ['Aquário', 'Touro']],
    ['1962-11-17', '08:43', { venus: 227.20, marte: 136.78, plutao: 161.97 }, ['Escorpião', 'Leão']],
    ['1957-06-12', '18:30', { venus: 97.34, marte: 114.60, plutao: 148.20 }, ['Câncer', 'Câncer']],
    ['1967-02-19', '07:08', { venus: 354.42, marte: 211.50, plutao: 169.83 }, ['Peixes', 'Escorpião']],
  ];
  for (const [data, hora, ref, [venus, marte]] of casos) {
    const p = calcularCorposCelestesParaHumanDesign(data, hora, -3).personalidade;
    for (const [k, v] of Object.entries(ref)) {
      const erro = Math.abs(((p[k] - v + 540) % 360) - 180);
      assert.ok(erro < 0.1, `${k} em ${data}: ${p[k].toFixed(2)} x ${v} (erro ${erro.toFixed(2)}°)`);
    }
    const s = calcularPlanetas(data, hora, -3);
    assert.equal(s.signoVenus, venus, `Vênus ${data}`);
    assert.equal(s.signoMarte, marte, `Marte ${data}`);
  }
});

test('signo solar pelo Sol real acerta o dia da troca (a tabela fixa erra)', async () => {
  const { calcularSignoSolar, calcularSigno } = await import('../lib/calculos.js');
  assert.equal(calcularSignoSolar('2013-03-20', '23:57', -3), 'Áries'); // tabela: Peixes
  assert.equal(calcularSigno(20, 3), 'Peixes');
  assert.equal(calcularSignoSolar('1971-04-20', '13:17', -3), 'Áries'); // tabela: Touro
  assert.equal(calcularSignoSolar('1994-12-21', '07:25', -2), 'Sagitário');
  assert.equal(calcularSignoSolar('1994-12-21'), 'Sagitário'); // sem hora: meio-dia de Brasília
});
