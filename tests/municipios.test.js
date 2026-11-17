// Testes de lib/municipios.js contra a base real (public/data/municipios-br.json).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  expandirMunicipios, buscarMunicipios, resolverMunicipio, municipioMaisProximo, separarUF,
} from '../lib/municipios.js';

const lista = expandirMunicipios(JSON.parse(readFileSync(new URL('../public/data/municipios-br.json', import.meta.url))));

test('base tem todos os municípios, com fuso', () => {
  assert.ok(lista.length >= 5570, `${lista.length}`);
  assert.equal(lista.filter((m) => m.capital).length, 27);
  for (const m of lista) assert.ok(m.tz.startsWith('America/'), m.nome);
});

test('separarUF', () => {
  assert.deepEqual(separarUF('Vitória, ES'), { nome: 'vitoria', uf: 'ES' });
  assert.deepEqual(separarUF('vitoria-es'), { nome: 'vitoria', uf: 'ES' });
  assert.deepEqual(separarUF('Vitória/ES'), { nome: 'vitoria', uf: 'ES' });
  assert.deepEqual(separarUF('Rio de Janeiro'), { nome: 'rio de janeiro', uf: null });
});

test('busca sem acento, capital primeiro', () => {
  const r = buscarMunicipios(lista, 'vitoria');
  assert.equal(r[0].nome, 'Vitória');
  assert.equal(r[0].uf, 'ES');
  assert.equal(buscarMunicipios(lista, 'sao paulo')[0].nome, 'São Paulo');
  assert.equal(buscarMunicipios(lista, 'v')[0], undefined); // < 2 letras
  const comUF = buscarMunicipios(lista, 'bom jesus pi');
  assert.ok(comUF.length > 0 && comUF.every((m) => m.uf === 'PI'));
});

test('resolver texto livre antigo', () => {
  assert.equal(resolverMunicipio(lista, 'Vitória - ES').ibge, 3205309);
  assert.equal(resolverMunicipio(lista, 'sao paulo').ibge, 3550308);
  assert.equal(resolverMunicipio(lista, 'Cidade Que Não Existe'), null);
  // "Bom Jesus" existe em vários estados e nenhum é capital → não chuta
  assert.equal(resolverMunicipio(lista, 'Bom Jesus'), null);
});

test('fusos de exceção vêm da base', () => {
  const by = (nome, uf) => lista.find((m) => m.nome === nome && m.uf === uf);
  assert.equal(by('Fernando de Noronha', 'PE').tz, 'America/Noronha');
  assert.equal(by('Eirunepé', 'AM').tz, 'America/Eirunepe');
  assert.equal(by('Manaus', 'AM').tz, 'America/Manaus');
  assert.equal(by('Santarém', 'PA').tz, 'America/Santarem');
  assert.equal(by('Belém', 'PA').tz, 'America/Belem');
  assert.equal(by('Salvador', 'BA').tz, 'America/Bahia');
});

test('município mais próximo', () => {
  assert.equal(municipioMaisProximo(lista, -20.32, -40.34).nome, 'Vitória');
});
