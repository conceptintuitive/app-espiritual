// Testes do blog: lib/blogPosts.js (categorias, corpo, bloco, leia também) e
// lib/blogCapa.js (Lua e SVG do céu da capa) e lib/blogBloco.js (bloco
// interativo) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BLOG_POSTS, CATEGORIAS, rotuloCategoria, tempoLeitura, blocosDoCorpo, posicaoDoBloco, leiaTambem, postDoNumero,
} from '../lib/blogPosts.js';
import { luaNoCeu, svgDoCeu, legendaCapa } from '../lib/blogCapa.js';
import { julianDay } from '../lib/sky.js';
import { tipoDoBloco, perguntaDoBloco, resultadoNumero, casaDoSigno, frasesSigno, primeiraFrase } from '../lib/blogBloco.js';

const SKY = JSON.parse(readFileSync(new URL('../public/olho/sky.json', import.meta.url), 'utf8'));

test('todo post tem categoria válida, data ISO e glifo; slugs únicos', () => {
  const ids = new Set(CATEGORIAS.map((c) => c.id));
  assert.ok(ids.has('mente'));
  assert.equal(rotuloCategoria('mente'), 'Mente e manifestação');
  const slugs = new Set();
  for (const p of BLOG_POSTS) {
    assert.ok(ids.has(p.categoria), `${p.slug}: categoria ${p.categoria}`);
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.coverGlyph, p.slug);
    assert.ok(!slugs.has(p.slug), `slug repetido: ${p.slug}`);
    slugs.add(p.slug);
    if (p.categoria === 'numeros') assert.equal(typeof p.numero, 'number', p.slug);
    if (p.categoria === 'signos') assert.ok(p.signo, p.slug);
  }
});

test('blocosDoCorpo: negrito sozinho na linha vira intertítulo, "- " vira lista', () => {
  const b = blocosDoCorpo('Abertura com **ênfase** no meio.\n\n**Primeiro**\nTexto um\ncontinua.\n\n**Lista**\n- a\n- b\nFecho.');
  assert.deepEqual(b, [
    { tipo: 'p', texto: 'Abertura com **ênfase** no meio.' },
    { tipo: 'h2', texto: 'Primeiro' },
    { tipo: 'p', texto: 'Texto um continua.' },
    { tipo: 'h2', texto: 'Lista' },
    { tipo: 'ul', itens: ['a', 'b'] },
    { tipo: 'p', texto: 'Fecho.' },
  ]);
});

test('posicaoDoBloco: antes do 3º intertítulo; sem intertítulos, no meio', () => {
  const com = blocosDoCorpo('A\n\n**1**\nB\n\n**2**\nC\n\n**3**\nD');
  assert.equal(com[posicaoDoBloco(com)].texto, '3');
  const sem = blocosDoCorpo('A\n\nB\n\nC\n\nD\n\nE');
  assert.equal(posicaoDoBloco(sem), 3);
});

test('tempoLeitura e leiaTambem', () => {
  assert.equal(tempoLeitura('palavra '.repeat(10)), '1 min de leitura');
  assert.equal(tempoLeitura('palavra '.repeat(401)), '3 min de leitura');
  const outros = leiaTambem('numerologia-numero-8');
  assert.equal(outros.length, 3);
  assert.ok(!outros.some((p) => p.slug === 'numerologia-numero-8'));
  assert.ok(outros.slice(0, 2).every((p) => p.categoria === 'numeros'));
  assert.equal(postDoNumero(4)?.slug, 'numerologia-numero-4');
  assert.equal(postDoNumero(5), null);
});

test('luaNoCeu: cheia ~100% iluminada, nova ~0%', () => {
  const cheia = luaNoCeu(julianDay(Date.UTC(2024, 3, 23, 23, 49)));   // Lua cheia 23/04/2024
  const nova = luaNoCeu(julianDay(Date.UTC(2024, 3, 8, 18, 21)));     // Lua nova 08/04/2024 (eclipse)
  assert.ok(cheia.iluminada > 0.97, String(cheia.iluminada));
  assert.ok(nova.iluminada < 0.03, String(nova.iluminada));
  // Lua nova = perto do Sol (08/04: Sol em ~18,9° de Áries, RA ~17°)
  assert.ok(Math.abs(nova.ra - 17) < 4, String(nova.ra));
});

test('svgDoCeu: SVG do tamanho pedido, com estrelas e constelações; legenda', () => {
  const { svg, rotulos, resumo } = svgDoCeu(SKY, '2026-11-23', { W: 1200, H: 630 });
  assert.match(svg, /^<svg[^>]+width="1200" height="630"/);
  assert.ok((svg.match(/<circle/g) || []).length > 300);
  assert.ok(svg.includes('<path'));
  assert.ok(!resumo.dia); // 21h em Brasília é noite
  assert.ok(rotulos.length <= 4);
  assert.equal(svgDoCeu(SKY, '2026-11-23', { W: 640, H: 800, rotulos: false }).rotulos.length, 0);
  assert.equal(legendaCapa('2026-11-23'), 'O céu sobre Brasília às 21h de 23/11/2026');
});

test('bloco: tipo e pergunta por categoria (inclusive Mente)', () => {
  assert.equal(tipoDoBloco('numeros'), 'numero');
  assert.equal(tipoDoBloco('mente'), 'dia');
  assert.equal(tipoDoBloco('lua'), 'dia');
  assert.equal(perguntaDoBloco('signos', 'Sagitário'), 'Onde Sagitário cai no seu mapa?');
  assert.equal(perguntaDoBloco('taro'), 'Qual carta rege o seu dia hoje?');
  assert.equal(perguntaDoBloco('mente'), 'Como aplicar isso no seu dia hoje?');
  assert.equal(perguntaDoBloco('principios'), 'O que isso muda no seu dia hoje?');
});

test('bloco Números: sobre você, post do número, página do número', () => {
  assert.deepEqual(resultadoNumero({ numero: 8, numeroPost: 8 }), { frase: 'O seu é 8.', sobreVoce: true, link: null });
  assert.equal(resultadoNumero({ numero: 11, numeroPost: 8, nome: 'Bianca' }).frase, 'Bianca, seu número é 11.');
  assert.equal(resultadoNumero({ numero: 4, numeroPost: 8, postDoNumero: 'numerologia-numero-4' }).link.href, '/blog/numerologia-numero-4');
  assert.equal(resultadoNumero({ numero: 3, numeroPost: 8 }).link.href, '/numerologia/numero-3');
});

test('bloco Signos: casa em signos inteiros e frases', () => {
  assert.equal(casaDoSigno('Sagitário', 'Virgem'), 4);
  assert.equal(casaDoSigno('Áries', 'Áries'), 1);
  assert.equal(casaDoSigno('Áries', 'Peixes'), 2);
  assert.deepEqual(frasesSigno({ nome: 'Bianca', signoPost: 'Sagitário', sol: 'Leão', ascendente: 'Virgem' }),
    ['Bianca, com Ascendente em Virgem, Sagitário cai na sua casa 4: casa, família e raízes.', 'O seu Sol está em Leão.']);
  assert.equal(frasesSigno({ signoPost: 'Sagitário', sol: 'Sagitário' })[0], 'Seu Sol está em Sagitário: este post é sobre você.');
  assert.equal(primeiraFrase('Uma frase. Outra frase.'), 'Uma frase.');
});
