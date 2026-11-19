// Testes de lib/kin.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  kinDaData, nomeDoKin, oraculo, ondaEncantada, calcularKin, relacaoDoDia, kinDeSeloTom, seloDoKin, SELOS, TONS,
} from '../lib/kin.js';
import { TEXTO_SELO, TEXTO_TOM, TEXTO_RELACAO_DIA } from '../lib/kinTextos.js';

test('Kin bate com tabelas publicadas do Dreamspell', () => {
  const refs = [
    ['2012-12-21', 207], ['2013-07-26', 164], ['1952-02-24', 107], ['1951-06-04', 102],
    ['2058-03-29', 90], ['1950-02-08', 141], ['1952-02-01', 84], ['1982-02-23', 136], ['1999-02-16', 94],
  ];
  for (const [d, k] of refs) assert.equal(kinDaData(d), k, d);
});

test('29/02: antes do meio-dia = 28/02, depois = 01/03', () => {
  assert.equal(kinDaData('2024-02-29', '09:00'), kinDaData('2024-02-28'));
  assert.equal(kinDaData('2024-02-29', '15:00'), kinDaData('2024-03-01'));
  assert.equal(kinDaData('2024-02-29'), kinDaData('2024-02-28'));
  assert.equal(kinDaData('2024-03-01') - kinDaData('2024-02-28'), 1);
});

test('nomes no padrão selo + tom + cor, com gênero', () => {
  assert.equal(nomeDoKin(1), 'Dragão Magnético Vermelho');
  assert.equal(nomeDoKin(207), 'Mão Cristal Azul');
  assert.equal(nomeDoKin(164), 'Semente Galáctica Amarela');
  assert.equal(nomeDoKin(260), 'Sol Cósmico Amarelo');
  assert.equal(nomeDoKin(137), 'Terra Ressonante Vermelha');
  assert.equal(SELOS.length, 20);
  assert.equal(TONS.length, 13);
  assert.equal(new Set(SELOS.map((s) => s.slug)).size, 20);
});

test('oráculo do Dreamspell', () => {
  assert.deepEqual(oraculo(1), { destino: 1, guia: 1, analogo: 118, antipoda: 131, oculto: 260 });
  assert.deepEqual(oraculo(207), { destino: 207, guia: 259, analogo: 12, antipoda: 77, oculto: 54 });
  const o = oraculo(137);
  assert.equal(nomeDoKin(o.guia), 'Lua Ressonante Vermelha');
  assert.equal(nomeDoKin(o.analogo), 'Vento Ressonante Branco');
  assert.equal(nomeDoKin(o.antipoda), 'Mão Ressonante Azul');
  assert.equal(nomeDoKin(o.oculto), 'Semente Ressonante Amarela');
  // guia é sempre da mesma cor
  for (let k = 1; k <= 260; k++) {
    assert.equal(seloDoKin(oraculo(k).guia).cor.nome, seloDoKin(k).cor.nome);
  }
});

test('onda encantada e kin de selo/tom', () => {
  assert.equal(ondaEncantada(137).selo.nomeCompleto, 'Macaco Azul');
  assert.equal(ondaEncantada(137).posicao, 7);
  assert.equal(ondaEncantada(1).inicio, 1);
  assert.equal(ondaEncantada(13).inicio, 1);
  assert.equal(ondaEncantada(14).inicio, 14);
  assert.equal(kinDeSeloTom(17, 7), 137);
});

test('Vitória, 21/12/1994 → Kin 137; relação com o dia', () => {
  const k = calcularKin({ data: '1994-12-21', hora: '07:25' });
  assert.equal(k.kin, 137);
  assert.equal(relacaoDoDia(137, 137), 'retorno');
  assert.equal(relacaoDoDia(137, 157), 'proprio'); // outra Terra
  assert.equal(relacaoDoDia(137, 189), 'guia');
  assert.equal(relacaoDoDia(137, 7), 'antipoda');
});

test('textos completos', () => {
  for (let i = 1; i <= 20; i++) for (const c of ['palavras', 'texto', 'sombra', 'hoje']) assert.ok(TEXTO_SELO[i]?.[c], `selo ${i} ${c}`);
  for (let i = 1; i <= 13; i++) for (const c of ['palavras', 'pergunta', 'texto', 'hoje']) assert.ok(TEXTO_TOM[i]?.[c], `tom ${i} ${c}`);
  for (const r of ['retorno', 'proprio', 'guia', 'analogo', 'antipoda', 'oculto', 'tom']) assert.ok(TEXTO_RELACAO_DIA[r]);
});
