// Testes das páginas de SEO do tarô e dos números (lib/seoTarot.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCANOS_SEO, slugDoArcano, arcanoPorSlug, vizinhos, numeroDoArcano, arcanoDoNumero, arcanosQueReduzem,
  exemploDoNumero, metaDoArcano, metaDoNumero, jsonLdDaPagina, jsonSeguro, BASE_URL,
} from '../lib/seoTarot.js';
import { NUMERO_PROFUNDO } from '../lib/manualgenerator.js';
import { calcularNumeroVida } from '../lib/calculos.js';
import { problemasDoTexto } from '../lib/socialEditorial.js';

const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

test('22 Arcanos, slugs únicos e limpos, cada um com o texto do bot (central, prática, 3 perguntas)', () => {
  assert.equal(ARCANOS_SEO.length, 22);
  assert.equal(new Set(ARCANOS_SEO.map((a) => a.slug)).size, 22);
  for (const a of ARCANOS_SEO) {
    assert.match(a.slug, /^[a-z]+(-[a-z]+)*$/, a.slug);
    assert.ok(a.central && a.pratica && a.significado && a.invertida, a.nome);
    assert.equal(a.perguntas.length, 3, a.nome);
    assert.equal(arcanoPorSlug(a.slug), a);
  }
  assert.equal(slugDoArcano('A Roda da Fortuna'), 'a-roda-da-fortuna');
  assert.equal(slugDoArcano('A Temperança'), 'a-temperanca');
  assert.equal(arcanoPorSlug('nao-existe'), null);
  assert.equal(vizinhos(0).anterior.nome, 'O Mundo');
  assert.equal(vizinhos(21).proximo.nome, 'O Louco');
});

test('ponte tarô ↔ número: soma dos dígitos, 11 fica, Louco e 22/33 sem par', () => {
  assert.equal(numeroDoArcano(0), null);
  assert.deepEqual(numeroDoArcano(4), { numero: 4, conta: null });
  assert.deepEqual(numeroDoArcano(11), { numero: 11, conta: null });
  assert.deepEqual(numeroDoArcano(13), { numero: 4, conta: '1 + 3 = 4' });
  assert.deepEqual(numeroDoArcano(19), { numero: 1, conta: '1 + 9 = 10 → 1 + 0 = 1' });
  assert.equal(arcanoDoNumero(1).nome, 'O Mago');
  assert.equal(arcanoDoNumero(11).nome, 'A Justiça');
  assert.equal(arcanoDoNumero(22), null);
  assert.equal(arcanoDoNumero(33), null);
  assert.deepEqual(arcanosQueReduzem(1).map((a) => a.nome), ['A Roda da Fortuna', 'O Sol']);
  assert.deepEqual(arcanosQueReduzem(4).map((a) => a.nome), ['A Morte']);
});

test('exemplo de cada número de vida bate com o cálculo do site', () => {
  for (const n of NUMEROS) {
    const e = exemploDoNumero(n);
    assert.ok(e, `sem exemplo pro ${n}`);
    const [d, m, y] = e.data.split('/');
    assert.equal(calcularNumeroVida(`${y}-${m}-${d}`), n, `${e.data} → ${n}`);
    assert.match(e.etapas.at(-1), new RegExp(`= ${n}$`));
  }
});

test('title e description: assunto primeiro, tamanho do Google, dentro das regras da marca', () => {
  for (const a of ARCANOS_SEO) {
    const m = metaDoArcano(a);
    assert.ok(m.title.startsWith(`${a.nome} no Tarô`), m.title);
    assert.ok(m.description.length <= 158, `${a.nome}: ${m.description.length}`);
    assert.deepEqual(problemasDoTexto(m.description), [], m.description);
    assert.deepEqual(problemasDoTexto(`${a.central} ${a.pratica} ${a.perguntas.join(' ')}`), [], a.nome);
  }
  for (const n of NUMEROS) {
    const m = metaDoNumero(n, NUMERO_PROFUNDO[n]);
    assert.ok(m.title.startsWith(`Número ${n} na Numerologia`), m.title);
    assert.ok(m.description.length <= 158, `${n}: ${m.description.length}`);
    assert.deepEqual(problemasDoTexto(m.description), [], m.description);
    assert.match(m.lead, /^[A-ZÁÉÍÓÚ].*\.$/);
  }
  assert.match(metaDoNumero(22, NUMERO_PROFUNDO[22]).title, /Número Mestre/);
});

test('JSON-LD: Article + BreadcrumbList com URLs absolutas; sem brecha pra </script>', () => {
  const [art, mig] = jsonLdDaPagina({ titulo: 'O Louco no Tarô', descricao: 'x', caminho: '/tarot/o-louco', migalhas: [['Início', '/'], ['Tarô', '/tarot']], sobre: 'O Louco' });
  assert.equal(art['@type'], 'Article');
  assert.equal(art.mainEntityOfPage, `${BASE_URL}/tarot/o-louco`);
  assert.equal(art.inLanguage, 'pt-BR');
  assert.equal(mig['@type'], 'BreadcrumbList');
  assert.deepEqual(mig.itemListElement.map((i) => i.item), [`${BASE_URL}/`, `${BASE_URL}/tarot`]);
  assert.ok(!jsonSeguro({ a: '</script><script>' }).includes('<'));
});
