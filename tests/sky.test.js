// Testes de lib/sky.js e lib/fusoBR.js — `npm test` (node --test, sem dependências).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  localToUTC, tzOffsetMinutes, julianDay, localSiderealDeg, altAz, sunRaDec,
  makeProjector, birthSky,
} from '../lib/sky.js';
import { fusoIANA, FUSOS_BR, FUSO_POR_UF } from '../lib/fusoBR.js';

const iso = (ms) => new Date(ms).toISOString().replace('.000', '');
const perto = (real, esperado, tol, msg) =>
  assert.ok(Math.abs(real - esperado) <= tol, `${msg}: ${real} (esperado ${esperado} ± ${tol})`);

// ── Casos pedidos ────────────────────────────────────────────────────────────

test('Vitória, 21/12/1994 07:25 → 09:25Z (horário de verão -2) e Sol ~18° (modo dia)', () => {
  const tz = fusoIANA({ uf: 'ES' });
  assert.equal(tz, 'America/Sao_Paulo');
  const utc = localToUTC({ y: 1994, m: 12, d: 21, hh: 7, mm: 25 }, tz);
  assert.equal(iso(utc), '1994-12-21T09:25:00Z');

  const ceu = birthSky({ data: '1994-12-21', hora: '07:25', lat: -20.32, lon: -40.34, tz });
  perto(ceu.sunAltDeg, 18, 1, 'altura do Sol');
  assert.equal(ceu.dia, true);
  assert.equal(ceu.aproximado, false);
});

test('São Paulo, 14/03/1992 21:00 → 1992-03-15T00:00Z e tempo sideral local ≈ 8h25', () => {
  const utc = localToUTC({ y: 1992, m: 3, d: 14, hh: 21, mm: 0 }, 'America/Sao_Paulo');
  assert.equal(iso(utc), '1992-03-15T00:00:00Z');

  const lstH = localSiderealDeg(julianDay(utc), -46.63) / 15;
  perto(lstH, 8 + 25 / 60, 5 / 60, 'TSL em horas'); // ± 5 min

  const ceu = birthSky({ data: '1992-03-14', hora: '21:00', lat: -23.55, lon: -46.63, tz: 'America/Sao_Paulo' });
  assert.equal(ceu.dia, false);
});

// ── Hora desconhecida ────────────────────────────────────────────────────────

test('sem hora: usa 21h, marca aproximado e nunca liga o modo dia', () => {
  // 21/12 em Porto Alegre: às 21h o Sol ainda está perto do horizonte no verão,
  // mas o modo dia tem que ficar desligado mesmo assim.
  const ceu = birthSky({ data: '1994-12-21', hora: null, lat: -30.03, lon: -51.23, tz: 'America/Sao_Paulo' });
  assert.equal(ceu.aproximado, true);
  assert.equal(ceu.dia, false);
  assert.equal(iso(ceu.utcMs), '1994-12-21T23:00:00Z'); // 21h com horário de verão (-2)
});

// ── Fuso histórico ───────────────────────────────────────────────────────────

test('horário de verão histórico por estado', () => {
  const jan2000 = Date.UTC(2000, 0, 15, 15);
  assert.equal(tzOffsetMinutes(jan2000, 'America/Sao_Paulo'), -120); // SP tinha verão
  // Ceará: teve verão em 1999/2000 e 2001/2002 (intermitente), não em 2003/2004
  assert.equal(tzOffsetMinutes(jan2000, 'America/Fortaleza'), -120);
  assert.equal(tzOffsetMinutes(Date.UTC(2004, 0, 15, 15), 'America/Fortaleza'), -180);
  assert.equal(tzOffsetMinutes(jan2000, 'America/Manaus'), -240);
  assert.equal(tzOffsetMinutes(jan2000, 'America/Cuiaba'), -180); // MT: -4 com verão
  // Depois de 2019 não há mais horário de verão em lugar nenhum
  assert.equal(tzOffsetMinutes(Date.UTC(2024, 0, 15, 15), 'America/Sao_Paulo'), -180);
  // Bahia: teve verão em 2011/2012, não em 2013/2014
  assert.equal(tzOffsetMinutes(Date.UTC(2012, 0, 15, 15), 'America/Bahia'), -120);
  assert.equal(tzOffsetMinutes(Date.UTC(2014, 0, 15, 15), 'America/Bahia'), -180);
  // Oeste do Pará era UTC-4 antes de jun/2008
  assert.equal(tzOffsetMinutes(Date.UTC(2005, 5, 15, 15), 'America/Santarem'), -240);
  assert.equal(tzOffsetMinutes(Date.UTC(2010, 5, 15, 15), 'America/Santarem'), -180);
});

test('fuso inválido cai pra UTC-3 sem quebrar', () => {
  const utc = localToUTC({ y: 2000, m: 6, d: 1, hh: 12, mm: 0 }, 'Nao/Existe');
  assert.equal(iso(utc), '2000-06-01T15:00:00Z');
});

test('fusoIANA: UF + exceções por município', () => {
  assert.equal(fusoIANA({ uf: 'BA' }), 'America/Bahia');
  assert.equal(fusoIANA({ uf: 'mt' }), 'America/Cuiaba');
  assert.equal(fusoIANA({ uf: 'PE', ibge: 2611606 }), 'America/Recife');
  assert.equal(fusoIANA({ uf: 'PE', ibge: 2605459 }), 'America/Noronha');
  assert.equal(fusoIANA({ uf: 'AM', oesteAM: true }), 'America/Eirunepe');
  assert.equal(fusoIANA({ uf: 'AM' }), 'America/Manaus');
  assert.equal(fusoIANA({ uf: 'PA', lon: -54.7 }), 'America/Santarem'); // Santarém
  assert.equal(fusoIANA({ uf: 'PA', lon: -48.49 }), 'America/Belem');   // Belém
  assert.equal(fusoIANA({ uf: 'XX' }), 'America/Sao_Paulo');
  assert.equal(Object.keys(FUSO_POR_UF).length, 27);
  for (const z of FUSOS_BR) assert.doesNotThrow(() => tzOffsetMinutes(Date.now(), z), z);
});

// ── Astronomia básica ────────────────────────────────────────────────────────

test('Sol nos solstícios/equinócio', () => {
  const [, decDez] = sunRaDec(julianDay(Date.UTC(1994, 11, 21, 12)));
  perto(decDez, -23.44, 0.1, 'declinação no solstício de dezembro');
  const [raMar, decMar] = sunRaDec(julianDay(Date.UTC(2000, 2, 20, 7, 35)));
  perto(decMar, 0, 0.1, 'declinação no equinócio');
  assert.ok(raMar < 0.5 || raMar > 359.5, `RA no equinócio ≈ 0 (${raMar})`);
});

test('altAz: estrela no meridiano com dec = latitude está no zênite', () => {
  const [alt] = altAz(120, -20, 120, -20);
  perto(alt * 180 / Math.PI, 90, 1e-9, 'altura');
});

test('projeção: zênite no centro, horizonte a R px', () => {
  const P = makeProjector({ lstDeg: 120, latDeg: -20, cx: 100, cy: 200, R: 50 });
  const [x, y] = P(120, -20);
  perto(x, 100, 1e-9, 'x do zênite');
  perto(y, 200, 1e-9, 'y do zênite');
  // Polo sul celeste fica a 20° de altura, no azimute 180° (sul) → abaixo do centro
  const [xs, ys, alts] = P(0, -90);
  perto(alts * 180 / Math.PI, 20, 1e-6, 'altura do polo sul');
  perto(xs, 100, 1e-6, 'polo sul no eixo vertical');
  assert.ok(ys > 200, 'sul fica embaixo');
  // Um ponto no horizonte (alt 0) fica a exatamente R do centro
  const Q = makeProjector({ lstDeg: 0, latDeg: 0, cx: 0, cy: 0, R: 50 });
  const [hx, hy] = Q(0, 90 - 1e-9); // polo norte, no horizonte do equador
  perto(Math.hypot(hx, hy), 50, 1e-4, 'raio do horizonte');
});

// ── Offset pro Ascendente (substitui a antiga heurística brasilUtcOffset) ─────

test('utcOffsetHoras: horário de verão real por estado e ano', async () => {
  const { utcOffsetHoras } = await import('../lib/sky.js');
  const o = (data, hora, tz) => utcOffsetHoras({ data, hora, tz });
  assert.equal(o('1994-12-21', '07:25', 'America/Sao_Paulo'), -2); // Vitória, verão
  assert.equal(o('1994-06-21', '07:25', 'America/Sao_Paulo'), -3);
  // Casos em que a heurística antiga (-2 de nov a fev, qualquer lugar/ano) errava:
  assert.equal(o('2005-12-15', '10:00', 'America/Recife'), -3);   // PE sem verão em 2005
  assert.equal(o('2010-01-15', '10:00', 'America/Manaus'), -4);   // AM é -4
  assert.equal(o('2022-01-15', '10:00', 'America/Sao_Paulo'), -3); // sem verão desde 2019
  assert.equal(o('1985-06-15', '10:00', 'America/Rio_Branco'), -5); // AC (inverno)
  assert.equal(o('1985-11-15', '10:00', 'America/Rio_Branco'), -4); // AC teve verão em 85/86
  assert.equal(o('2000-03-01', '10:00', 'America/Sao_Paulo'), -3); // verão acabou em fev/2000
  assert.equal(o('1999-10-20', '10:00', 'America/Sao_Paulo'), -2); // e começou em out/1999
});
