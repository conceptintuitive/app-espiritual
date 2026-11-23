// Testes de lib/ceuNascimento.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resumoCeu, projetarCeu, lugarDoPerfil, horaCurta, pontoNaCapa, LUGAR_PADRAO } from '../lib/ceuNascimento.js';

const SKY = JSON.parse(readFileSync(new URL('../public/olho/sky.json', import.meta.url), 'utf8'));
const VITORIA = { nome: 'Vitória', lat: -20.32, lon: -40.34, tz: 'America/Sao_Paulo' };

test('horaCurta', () => {
  assert.equal(horaCurta('07:25'), '7h25');
  assert.equal(horaCurta('21:00'), '21h');
  assert.equal(horaCurta('00:05'), '0h05');
});

test('lugarDoPerfil: sem cidade (ou sem coordenada) cai em Brasília, sem nome', () => {
  assert.equal(lugarDoPerfil(null), LUGAR_PADRAO);
  assert.equal(lugarDoPerfil({ nome: 'X', lat: null, lon: -40 }), LUGAR_PADRAO);
  assert.deepEqual(lugarDoPerfil({ nome: 'Vitória', uf: 'ES', lat: -20.32, lon: -40.34, tz: 'America/Sao_Paulo' }), VITORIA);
});

test('Vitória 21/12/1994 07:25: manhã, Sol a leste, modo dia', () => {
  const r = resumoCeu({ data: '1994-12-21', hora: '07:25', lugar: VITORIA });
  assert.equal(r.dia, true);
  assert.equal(r.solLeste, true);
  assert.equal(r.valor, 'Manhã, Sol a leste');
  assert.equal(r.legenda, 'O céu sobre Vitória às 7h25 de 21/12/1994');
  assert.equal(r.extra, 'O Sol já tinha nascido.');
});

test('nascimento de noite: céu estrelado, sem frase do Sol', () => {
  const r = resumoCeu({ data: '1990-06-10', hora: '23:40', lugar: VITORIA });
  assert.equal(r.dia, false);
  assert.equal(r.valor, 'Noite, céu estrelado');
  assert.equal(r.extra, '');
});

test('fim de tarde: Sol a oeste', () => {
  const r = resumoCeu({ data: '2001-01-15', hora: '16:30', lugar: VITORIA });
  assert.equal(r.dia, true);
  assert.equal(r.solLeste, false);
  assert.equal(r.valor, 'Tarde, Sol a oeste');
});

test('sem hora: 21h, céu aproximado, nunca modo dia (nem no verão)', () => {
  const r = resumoCeu({ data: '1994-12-21', hora: null, lugar: VITORIA });
  assert.equal(r.aproximado, true);
  assert.equal(r.dia, false);
  assert.equal(r.valor, 'Noite, céu aproximado');
  assert.equal(r.legenda, 'O céu sobre Vitória às 21h de 21/12/1994 · céu aproximado');
});

test('sem cidade: legenda fala do Brasil', () => {
  const r = resumoCeu({ data: '1994-12-21', hora: '07:25' });
  assert.match(r.legenda, /^O céu sobre o Brasil às 7h25/);
});

test('projetarCeu: estrelas dentro da caixa, Cruzeiro no céu de Vitória e rótulos fora da faixa do texto', () => {
  const lugar = VITORIA;
  const r = resumoCeu({ data: '1994-12-21', hora: '07:25', lugar });
  const W = 390, H = 560;
  const p = projetarCeu(SKY, r, lugar, { W, H, cx: W / 2, cy: H * 0.485, R: 470, rotuloMaxY: H * 0.55 });
  assert.ok(p.estrelas.length > 100, `estrelas: ${p.estrelas.length}`);
  for (const e of p.estrelas) assert.ok(e.x >= -20 && e.x <= W + 20 && e.y >= -20 && e.y <= H + 20);
  assert.ok(p.linhas.some((l) => l.id === 'Cru'), 'Cruzeiro do Sul visível');
  assert.ok(p.rotulos.length <= 5);
  for (const l of p.rotulos) assert.ok(l.y < H * 0.55);
  // de manhã o Sol fica a leste = à esquerda do zênite (olhando pra cima)
  assert.ok(p.sol.x < W / 2);
  assert.equal(p.sol.dia, true);
});

test('pontoNaCapa: imagem do mesmo formato = proporção direta', () => {
  assert.deepEqual(pontoNaCapa(941, 1672, 941, 1672, 0.5, 0.485), { x: 470.5, y: 1672 * 0.485 });
  const q = pontoNaCapa(1440, 480, 1672, 941, 0.5, 0.5);
  assert.equal(q.x, 720);
  assert.equal(q.y, 240);
});
