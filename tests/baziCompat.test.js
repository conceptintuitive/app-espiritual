// Testes de lib/baziCompat.js + lib/baziCompatTextos.js — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularBazi } from '../lib/bazi.js';
import {
  compatibilidadeBazi, choqueTroncos, relacaoElementos, necessidadeDoMapa,
} from '../lib/baziCompat.js';
import {
  textoDiaMestre, textoDeuses, textoPalacio, textosOcultos, textosClima, textoAnimais,
  textoCruzada, pontosResumo, conselhoFinal, NIVEL_COMPAT,
} from '../lib/baziCompatTextos.js';

// Xin Si (Metal Yin, inverno) x Yi Si (Madeira Yin, verão) — os dois em Vitória.
const bianca = calcularBazi({ data: '1994-12-21', hora: '07:25', tz: 'America/Sao_Paulo', lon: -40.34 });
const leo = calcularBazi({ data: '1994-05-19', hora: '09:30', tz: 'America/Sao_Paulo', lon: -40.34 });

/** Mapa mínimo a partir de [tronco, ramo] por pilar (sem hora = null). */
function mapa(ano, mes, dia, hora = null) {
  const p = ([tronco, ramo]) => ({ tronco, ramo });
  return { ano: p(ano), mes: p(mes), dia: p(dia), hora: hora && p(hora), diaMestre: dia[0] };
}

test('choque de troncos: só Jia–Geng, Yi–Xin, Bing–Ren, Ding–Gui', () => {
  assert.equal(choqueTroncos(1, 7), true);
  assert.equal(choqueTroncos(7, 1), true);
  assert.equal(choqueTroncos(0, 6), true);
  assert.equal(choqueTroncos(4, 9), false); // Wu–Gui é combinação, não choque
  assert.equal(choqueTroncos(4, 8), false); // Terra não choca
});

test('relação de elementos do ponto de vista de A', () => {
  assert.equal(relacaoElementos(7, 1), 'aControlaB'); // Metal → Madeira
  assert.equal(relacaoElementos(1, 7), 'bControlaA');
  assert.equal(relacaoElementos(0, 2), 'aGeraB'); // Madeira → Fogo
  assert.equal(relacaoElementos(2, 0), 'bGeraA');
  assert.equal(relacaoElementos(0, 1), 'mesmo');
});

test('necessidade: inverno pede Fogo, verão pede Água', () => {
  assert.deepEqual(necessidadeDoMapa(bianca), { elemento: 1, motivo: 'frio' });
  assert.deepEqual(necessidadeDoMapa(leo), { elemento: 4, motivo: 'quente' });
});

test('caso de referência: Xin Si x Yi Si', () => {
  const c = compatibilidadeBazi(bianca, leo);
  assert.equal(c.dm.choque, true);
  assert.equal(c.dm.aParaB, 'seteMatancas');
  assert.equal(c.palacio.mesmo, true);
  assert.ok(c.oculta.aEmB && c.oculta.aEmB.principal, 'Xin combina com o Bing principal da Serpente');
  assert.ok(c.oculta.bEmA && !c.oculta.bEmA.principal, 'Yi combina com o Geng residual da Serpente');
  assert.equal(c.clima.bSupreA.nivel, 'muito');
  assert.equal(c.clima.aSupreB.nivel, 'algum');
  assert.equal(c.nivel, 'forte');
  assert.ok(c.pontuacao >= 72 && c.pontuacao <= 84);
  // Combinação Bing (mês dela) + Xin (hora dele) e Coelho + Cachorro aparecem nas cruzadas.
  assert.ok(c.cruzadas.some((x) => x.tipo === 'combinacaoTronco' && x.posA === 'mes' && x.posB === 'hora'));
  assert.ok(c.cruzadas.some((x) => x.tipo === 'combinacao' && x.posA === 'hora' && x.posB === 'ano'));
});

test('Day Masters que se combinam + palácios que se combinam dão nota alta', () => {
  // Jia (0) x Ji (5): combinação → Terra. Palácios Rato (0) x Boi (1): combinação.
  const a = mapa([0, 2], [2, 2], [0, 0]);
  const b = mapa([1, 3], [3, 3], [5, 1]);
  const c = compatibilidadeBazi(a, b);
  assert.equal(c.dm.combinacao, 2);
  assert.deepEqual(c.palacio.relacoes, ['combinacao']);
  assert.ok(c.pontuacao >= 80);
});

test('palácios em choque derrubam a nota', () => {
  const a = mapa([0, 2], [2, 2], [0, 0]); // Rato
  const b = mapa([0, 2], [2, 2], [2, 6]); // Cavalo
  const c = compatibilidadeBazi(a, b);
  assert.deepEqual(c.palacio.relacoes, ['choque']);
  assert.ok(c.pontuacao < 72);
});

test('a nota é simétrica (A x B = B x A) e fica entre 35 e 97', () => {
  const casos = [[bianca, leo], [mapa([0, 2], [2, 2], [0, 0]), mapa([4, 6], [6, 6], [6, 6])]];
  for (const [a, b] of casos) {
    const ab = compatibilidadeBazi(a, b).pontuacao;
    const ba = compatibilidadeBazi(b, a).pontuacao;
    assert.equal(ab, ba);
    assert.ok(ab >= 35 && ab <= 97);
  }
});

test('funciona sem hora (pilar da hora null)', () => {
  const a = calcularBazi({ data: '1990-03-10', hora: null });
  const b = calcularBazi({ data: '1992-08-25', hora: null });
  const c = compatibilidadeBazi(a, b);
  assert.ok(c.cruzadas.every((x) => x.posA !== 'hora' && x.posB !== 'hora'));
});

test('textos: todos montam sem undefined', () => {
  const pares = [
    [bianca, leo],
    [mapa([0, 2], [2, 2], [0, 0]), mapa([1, 3], [3, 3], [5, 1])],
    [mapa([0, 2], [2, 2], [0, 0]), mapa([0, 2], [2, 2], [2, 6])],
    [mapa([0, 2], [2, 2], [4, 0]), mapa([0, 2], [2, 2], [8, 4])], // Wu x Ren: 7 Matanças sem choque
    [mapa([0, 2], [2, 2], [0, 0]), mapa([0, 2], [2, 2], [1, 3])], // mesmo elemento
  ];
  for (const [a, b] of pares) {
    const c = compatibilidadeBazi(a, b);
    const todos = [
      NIVEL_COMPAT[c.nivel].titulo,
      textoDiaMestre(c, a, b, 'Ana', 'Bruno'),
      ...textoDeuses(c, 'Ana', 'Bruno'),
      textoPalacio(c, 'Ana', 'Bruno'),
      ...textosOcultos(c, a, b, 'Ana', 'Bruno'),
      ...textosClima(c, 'Ana', 'Bruno'),
      textoAnimais(c, 'Ana', 'Bruno'),
      ...c.cruzadas.flatMap((x) => Object.values(textoCruzada(x, 'Ana', 'Bruno')).filter((v) => typeof v === 'string')),
      ...Object.values(pontosResumo(c, 'Ana', 'Bruno')).flat(),
      conselhoFinal(c, 'Ana', 'Bruno'),
    ];
    for (const t of todos) {
      assert.equal(typeof t, 'string');
      assert.ok(!t.includes('undefined') && !t.includes('null') && !t.includes('NaN'), t);
    }
  }
});

test('texto do caso de referência: Metal corta Madeira e quem cobra é A', () => {
  const c = compatibilidadeBazi(bianca, leo);
  const t = textoDiaMestre(c, bianca, leo, 'Bianca', 'Leo');
  assert.match(t, /Metal corta Madeira/);
  assert.match(t, /Bianca cobra/);
  assert.match(conselhoFinal(c, 'Bianca', 'Leo'), /crítica de Bianca/);
});
