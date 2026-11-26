// Gabarito gerado com o Swiss Ephemeris (pyswisseph, modo Moshier) + roda de
// portas/canais padrão, na conferência de nov/2026. As três últimas datas são
// casos em que o cálculo antigo (lib/calculos.js) errava Tipo ou Autoridade.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularHumanDesign } from '../lib/humanDesign.js';

const GABARITO = [
  { data: '1955-05-08', hora: '10:42', offset: 0, tipo: 'Manifesting Generator', autoridade: 'Sacral', perfil: '5/1' },
  { data: '1952-09-08', hora: '20:16', offset: 0, tipo: 'Projector', autoridade: 'Esplênica (Baço)', perfil: '6/2' },
  { data: '1988-07-15', hora: '09:03', offset: 0, tipo: 'Manifestor', autoridade: 'Emocional (Solar Plexus)', perfil: '3/5' },
  { data: '1996-05-30', hora: '15:45', offset: 0, tipo: 'Generator', autoridade: 'Sacral', perfil: '4/1' },
  { data: '1992-05-02', hora: '00:55', offset: 0, tipo: 'Reflector', autoridade: 'Lunar (Reflector)', perfil: '5/1' },
  { data: '1971-12-22', hora: '04:35', offset: 0, tipo: 'Manifesting Generator', autoridade: 'Emocional (Solar Plexus)', perfil: '2/4' },
  { data: '2008-07-05', hora: '03:10', offset: 0, tipo: 'Projector', autoridade: 'Esplênica (Baço)', perfil: '5/1' },
  { data: '1993-06-04', hora: '11:00', offset: 0, tipo: 'Generator', autoridade: 'Emocional (Solar Plexus)', perfil: '3/5' },
];

for (const g of GABARITO) {
  test(`Human Design ${g.data} ${g.hora} UTC${g.offset} → ${g.tipo}`, () => {
    const hd = calcularHumanDesign(g.data, g.hora, g.offset);
    assert.equal(hd.tipo, g.tipo);
    assert.equal(hd.autoridade, g.autoridade);
    assert.equal(hd.perfil, g.perfil);
  });
}

test('Human Design aplica o fuso: 06:03 em UTC−3 = 09:03 UTC', () => {
  const local = calcularHumanDesign('1988-07-15', '06:03', -3);
  const utc = calcularHumanDesign('1988-07-15', '09:03', 0);
  assert.deepEqual(local.personalidade, utc.personalidade);
  assert.deepEqual(local.design, utc.design);
});

test('Human Design atravessa a meia-noite com o fuso (23:30 em UTC−3 = 02:30 do dia seguinte)', () => {
  const local = calcularHumanDesign('1990-03-10', '23:30', -3);
  const utc = calcularHumanDesign('1990-03-11', '02:30', 0);
  assert.deepEqual(local.personalidade, utc.personalidade);
});
