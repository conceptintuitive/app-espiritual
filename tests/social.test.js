// Testes do conteúdo diário do Instagram/TikTok (lib/social.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  temaDoDia, serieDoTema, itemDaSerie, planoDosDias, SERIES, postDoDia, energiaDoDia, montarLegenda,
  nomeDaFase, luaDoDia, contaNumeroVida, tituloCurto, assinarImagem, conferirAssinatura, caminhoImagem,
  redesLigadas, CTA_FEED, CTA_STORY, HASHTAGS_BASE, diaDaSemana,
} from '../lib/social.js';
import { calcularNumeroVida } from '../lib/calculos.js';

// Semana de referência: 23/11/2026 (segunda) a 29/11/2026 (domingo).
const SEG = '2026-11-23';

test('rotação por dia da semana', () => {
  assert.equal(diaDaSemana(SEG), 1);
  assert.equal(temaDoDia('2026-11-23'), 'numero');
  assert.equal(temaDoDia('2026-11-24'), 'ponto_cego');
  assert.equal(temaDoDia('2026-11-25'), 'anjo');
  assert.equal(temaDoDia('2026-11-26'), null); // quinta: feito à mão
  assert.ok(['animal', 'selo'].includes(temaDoDia('2026-11-27')));
  assert.equal(temaDoDia('2026-11-28'), 'comenta');
  assert.equal(temaDoDia('2026-11-29'), 'semana');
  assert.equal(postDoDia('2026-11-26'), null);
});

test('sexta alterna animal e selo, semana sim, semana não', () => {
  assert.equal(temaDoDia('2026-01-02'), 'animal');
  assert.equal(temaDoDia('2026-01-09'), 'selo');
  assert.equal(temaDoDia('2026-01-16'), 'animal');
  const sextas = Array.from({ length: 10 }, (_, k) => temaDoDia(new Date(Date.UTC(2026, 10, 27 + 7 * k)).toISOString().slice(0, 10)));
  for (let k = 1; k < sextas.length; k++) assert.notEqual(sextas[k], sextas[k - 1]);
  // antes da data de referência também alterna
  assert.notEqual(temaDoDia('2025-12-26'), temaDoDia('2026-01-02'));
});

test('séries: ordem, tamanho e volta sem repetir', () => {
  assert.deepEqual(SERIES.numero, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
  assert.equal(SERIES.ponto_cego[0], 'Áries');
  assert.equal(SERIES.ponto_cego[11], 'Peixes');
  assert.equal(SERIES.anjo.length, 72);
  assert.equal(SERIES.selo.length, 20);
  assert.equal(SERIES.animal.length, 12);
  for (const [serie, lista] of Object.entries(SERIES)) {
    const vistos = new Set();
    for (let i = 0; i < lista.length; i++) vistos.add(itemDaSerie(serie, i).item);
    assert.equal(vistos.size, lista.length, `${serie} repetiu antes da volta`);
    assert.equal(itemDaSerie(serie, lista.length).item, lista[0], `${serie} volta ao começo`);
    assert.equal(itemDaSerie(serie, lista.length).volta, 2);
  }
  assert.equal(itemDaSerie('numero', 11).item, 33);
  assert.equal(itemDaSerie('anjo', 71).item, 72);
  assert.equal(serieDoTema('comenta'), null);
  assert.equal(serieDoTema('semana'), null);
  assert.equal(serieDoTema(null), null);
});

test('plano: cada série anda só no dia do seu tema e não mexe no estado', () => {
  const estado = { numero: 11, ponto_cego: 3, anjo: 70, animal: 0, selo: 5 };
  const plano = planoDosDias(SEG, 15, estado);
  assert.deepEqual(estado, { numero: 11, ponto_cego: 3, anjo: 70, animal: 0, selo: 5 });
  const seg = plano.filter((d) => d.tema === 'numero').map((d) => d.indice);
  assert.deepEqual(seg, [11, 12, 13]);
  assert.deepEqual(seg.map((i) => itemDaSerie('numero', i).item), [33, 1, 2]); // 33 → volta pro 1
  assert.deepEqual(plano.filter((d) => d.tema === 'anjo').map((d) => itemDaSerie('anjo', d.indice).item), [71, 72]);
  const sextas = plano.filter((d) => diaDaSemana(d.data) === 5);
  assert.equal(sextas.length, 2);
  assert.notEqual(sextas[0].serie, sextas[1].serie);
  for (const d of plano.filter((x) => ['comenta', 'semana', null].includes(x.tema))) assert.equal(d.indice, null);
  // estado vazio começa do zero
  assert.equal(planoDosDias(SEG, 1, {})[0].indice, 0);
});

test('fase da Lua: convenção do calendário brasileiro', () => {
  assert.equal(nomeDaFase(5), 'Lua Nova');
  assert.equal(nomeDaFase(89), 'Lua Nova');
  assert.equal(nomeDaFase(95), 'Lua Crescente');
  assert.equal(nomeDaFase(179), 'Lua Crescente');
  assert.equal(nomeDaFase(185), 'Lua Cheia');
  assert.equal(nomeDaFase(300), 'Lua Minguante');
  // cheia de 24/11/2026 (~11h50 de Brasília): ao meio-dia já é Cheia; no dia 23, Crescente
  assert.equal(luaDoDia('2026-11-24').fase, 'Lua Cheia');
  assert.equal(luaDoDia('2026-11-23').fase, 'Lua Crescente');
  assert.ok(luaDoDia('2026-11-24').iluminada > 0.97);
});

test('story: título, frase, 4 linhas e a chamada', () => {
  const e = energiaDoDia('2026-11-24');
  assert.match(e.kicker, /^Energia de hoje · TER 24\/11$/);
  assert.ok(e.titulo.startsWith('Dia '));
  assert.ok(e.frase.length > 10);
  assert.deepEqual(e.linhas.map((l) => l.rotulo), ['Lua', 'Kin do dia', 'Anjo destes dias']);
  for (const l of e.linhas) assert.ok(l.valor && l.nota, l.rotulo);
  assert.equal(e.cta, CTA_STORY);
  assert.equal(e.anjo, 'Vehuel'); // Sol no começo de Sagitário
});

test('posts da semana: conteúdo de cada tema e legenda no formato', () => {
  const plano = planoDosDias(SEG, 7, {});
  const proibidos = /diagnóstico completo|análise completa|mapa completo|garant|cura (de|da|do)|vai (ficar rica|enriquecer)/i;
  for (const d of plano) {
    const p = postDoDia(d.data, d.indice ?? 0);
    if (!d.tema) { assert.equal(p, null); continue; }
    assert.equal(p.tema, d.tema);
    assert.ok(p.kicker && p.titulo && p.linhas.length >= 2, d.tema);
    const leg = montarLegenda(p.legenda);
    const linhas = leg.split('\n');
    assert.equal(linhas[0], p.legenda.gancho);
    assert.equal(linhas[1], '');
    assert.ok(leg.includes(`\n\n${CTA_FEED}\n\n`));
    const tags = linhas[linhas.length - 1].split(' ');
    assert.ok(tags.length >= 5 && tags.length <= 8, `${d.tema}: ${tags.length} hashtags`);
    for (const h of HASHTAGS_BASE) assert.ok(tags.includes(h));
    assert.ok(leg.length < 2200);
    assert.doesNotMatch(leg, proibidos);
    if (d.tema !== 'semana') assert.ok(p.legenda.texto.length >= 2 && p.legenda.texto.length <= 4, `${d.tema}: ${p.legenda.texto.length} linhas`);
  }
  assert.equal(postDoDia('2026-11-23', 0).grande, '1');
  assert.equal(postDoDia('2026-11-23', 11).grande, '33');
  assert.match(postDoDia('2026-11-23', 11).kicker, /mestre/);
  assert.equal(postDoDia('2026-11-24', 7).item, 'Escorpião');
  const anjo = postDoDia('2026-11-25', 0);
  assert.equal(anjo.item, 'Vehuiah');
  assert.match(anjo.legenda.gancho, /^Nasceu entre \d\d\/03 e \d\d\/03\? Seu anjo da guarda é Vehuiah\.$/);
  const semana = postDoDia('2026-11-29');
  assert.equal(semana.dias.length, 7);
  assert.equal(semana.dias[0].data, '2026-11-30');
  assert.equal(semana.dias[6].data, '2026-12-06');
  for (const d of semana.dias) assert.match(d.hexagrama, /^\S+ sobre \S+$/);
  assert.ok(semana.linhas.every((l) => / sobre /.test(l.texto)));
});

test('sexta: animal com anos certos e selo com nome do Sincronário', () => {
  const animal = postDoDia('2026-01-02', 4); // Dragão
  assert.equal(animal.item, 'Dragão');
  assert.match(animal.linhas[0].texto, /2024/);
  assert.match(animal.linhas[0].texto, /2012/);
  assert.match(animal.legenda.gancho, /\(a partir de 4\/fev\)\? Você é o Dragão\.$/);
  assert.match(animal.titulo, /\?$/);
  assert.equal(animal.tituloNota, '(a partir de 4/fev)');
  assert.ok(animal.linhas.some((l) => /janeiro/.test(l.rotulo) && l.texto === 'Você é do animal anterior.'));
  const selo = postDoDia('2026-01-09', 0);
  assert.equal(selo.item, 'Dragão Vermelho');
});

test('sábado: a conta do exemplo bate com calcularNumeroVida', () => {
  for (const dataBR of ['28/11/1994', '29/11/1999', '09/09/1989', '11/02/1990']) {
    const { numero } = contaNumeroVida(dataBR);
    const [d, m, y] = dataBR.split('/');
    assert.equal(numero, calcularNumeroVida(`${y}-${m}-${d}`), dataBR);
  }
  const p = postDoDia('2026-11-28');
  assert.equal(p.item.slice(0, 5), '28/11');
  assert.ok(p.legenda.texto[1].includes(p.item));
});

test('título do TikTok cabe em 90 caracteres', () => {
  assert.equal(tituloCurto('Curto.'), 'Curto');
  const longo = tituloCurto('a '.repeat(80));
  assert.ok(longo.length <= 90);
  assert.ok(longo.endsWith('…'));
});

test('URL da imagem assinada: só vale com o mesmo segredo, data, formato e item', () => {
  const seg = 'segredo-teste';
  const t = assinarImagem({ data: SEG, formato: 'feed', indice: 3 }, seg);
  assert.equal(t.length, 32);
  assert.ok(conferirAssinatura({ data: SEG, formato: 'feed', indice: 3, t }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'feed', indice: 4, t }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'story', indice: 3, t }, seg));
  assert.ok(!conferirAssinatura({ data: '2026-11-24', formato: 'feed', indice: 3, t }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'feed', indice: 3, t }, 'outro'));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'feed', indice: 3, t: 'x' }, seg));
  assert.ok(!conferirAssinatura({ data: SEG, formato: 'feed', indice: 3, t }, ''));
  assert.match(caminhoImagem({ data: SEG, formato: 'story' }, seg), /^\/api\/social\/imagem\/2026-11-23\/story\.jpg\?t=[0-9a-f]{32}$/);
  assert.match(caminhoImagem({ data: SEG, formato: 'feed', indice: 0 }, seg), /\?i=0&t=/);
});

test('chave liga/desliga', () => {
  assert.deepEqual(redesLigadas(undefined), []);
  assert.deepEqual(redesLigadas('off'), []);
  assert.deepEqual(redesLigadas('on'), ['instagram', 'tiktok']);
  assert.deepEqual(redesLigadas('instagram'), ['instagram']);
  assert.deepEqual(redesLigadas('TikTok'), ['tiktok']);
  assert.deepEqual(redesLigadas('instagram,tiktok'), ['instagram', 'tiktok']);
  assert.deepEqual(redesLigadas('qualquer'), []);
});
