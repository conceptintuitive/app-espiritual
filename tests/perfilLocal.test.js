// Testes de lib/perfilLocal.js — `npm test` (window/localStorage simulados).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.Event = class { constructor(t) { this.type = t; } };

const { lerPerfil, salvarPerfil, salvarSeForMeu, limparPerfil } = await import('../lib/perfilLocal.js');
const VIX = { ibge: 3205309, nome: 'Vitória', uf: 'ES', lat: -20.3, lon: -40.34, tz: 'America/Sao_Paulo' };

beforeEach(() => mem.clear());

test('salva e lê; data inválida não grava', () => {
  salvarPerfil({ nome: ' Bianca ', dataNascimento: '1994-12-21', hora: '07:25', cidade: VIX });
  const p = lerPerfil();
  assert.equal(p.nome, 'Bianca');
  assert.equal(p.hora, '07:25');
  assert.equal(p.cidade.tz, 'America/Sao_Paulo');
  salvarPerfil({ dataNascimento: '21/12/1994' });
  assert.equal(lerPerfil().dataNascimento, '1994-12-21');
});

test('mesma pessoa: campos vazios não apagam; hora null explícita apaga', () => {
  salvarPerfil({ nome: 'Bianca', dataNascimento: '1994-12-21', hora: '07:25', cidade: VIX });
  salvarPerfil({ nome: '', dataNascimento: '1994-12-21' }); // Kin: sem hora nem cidade
  let p = lerPerfil();
  assert.equal(p.nome, 'Bianca');
  assert.equal(p.hora, '07:25');
  assert.equal(p.cidade.nome, 'Vitória');
  salvarPerfil({ dataNascimento: '1994-12-21', hora: null }); // "não sei a hora"
  p = lerPerfil();
  assert.equal(p.hora, null);
  assert.equal(p.cidade.nome, 'Vitória');
});

test('salvarSeForMeu não troca o perfil por outra pessoa', () => {
  assert.equal(salvarSeForMeu({ nome: 'Bianca', dataNascimento: '1994-12-21' }), true);
  assert.equal(salvarSeForMeu({ nome: 'Amiga', dataNascimento: '1990-05-01' }), false);
  assert.equal(lerPerfil().nome, 'Bianca');
  assert.equal(salvarSeForMeu({ nome: 'Bia', dataNascimento: '1994-12-21', hora: '07:25' }), true);
  assert.equal(lerPerfil().hora, '07:25');
  limparPerfil();
  assert.equal(lerPerfil(), null);
});
