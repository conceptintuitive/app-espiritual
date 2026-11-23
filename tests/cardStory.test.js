// Testes de lib/cardStory.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dadosDoCard } from '../lib/cardStory.js';

const VITORIA = { ibge: 3205309, nome: 'Vitória', uf: 'ES', lat: -20.3155, lon: -40.3128, tz: 'America/Sao_Paulo' };

test('Bianca, 21/12/1994 07:25, Vitória: textos do croqui', () => {
  const d = dadosDoCard({ nome: 'bianca padua', dataNascimento: '1994-12-21', hora: '07:25', cidade: VITORIA });
  assert.equal(d.nome, 'Bianca');
  assert.equal(d.temas, 'Construir · Intuir');
  assert.equal(d.numero, '11');
  assert.deepEqual(d.sistemas.map((s) => s.k), ['Signo solar', 'Número de vida', 'Anjo da guarda', 'Anjo da mente', 'Astrologia chinesa', 'Kin Maia 137']);
  assert.equal(d.sistemas[0].v, 'Sagitário');
  assert.equal(d.frase, 'Uma parte de mim quer raiz. A outra quer estrada.');
  assert.deepEqual(d.legenda, ['O céu sobre Vitória', 'às 7h25 de 21/12/1994']);
  assert.equal(d.fundo, 'Ao fundo, o céu da manhã em que eu cheguei');
  assert.equal(d.ceu.dia, true);
  assert.deepEqual(d.tres.map((s) => s.k), ['Signo', 'Anjo', 'Kin']);
});

test('sem hora: 6 sistemas com o céu no lugar do anjo da mente, legenda aproximada', () => {
  const d = dadosDoCard({ nome: 'Juliana', dataNascimento: '1988-03-14', hora: null, cidade: { ...VITORIA, nome: 'Porto Alegre', uf: 'RS', lat: -30.03, lon: -51.21 } });
  assert.equal(d.sistemas.length, 6);
  assert.equal(d.sistemas[3].k, 'Céu do nascimento');
  assert.equal(d.sistemas[3].v, 'Noite, céu aproximado');
  assert.deepEqual(d.legenda, ['O céu sobre Porto Alegre', 'às 21h de 14/03/1988 · céu aproximado']);
  assert.equal(d.fundo, 'Ao fundo, o céu aproximado da noite em que eu cheguei');
  assert.ok(d.frase.length > 0);
});

test('sem nome e sem cidade', () => {
  const d = dadosDoCard({ dataNascimento: '1990-06-10', hora: '23:40' });
  assert.equal(d.nome, 'Meu mapa');
  assert.match(d.legenda[0], /sobre o Brasil/);
  assert.equal(d.fundo, 'Ao fundo, o céu da noite em que eu cheguei');
});
