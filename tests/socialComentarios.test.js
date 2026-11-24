// Testes da resposta automática a comentários (lib/socialComentarios.js) e do
// roteiro do Reels (lib/socialReels.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataNoComentario, ehOfensivo, modeloDaResposta, respostaParaData, decidirResposta, CTA_RESPOSTA } from '../lib/socialComentarios.js';
import { roteiroReels, trilhaDoDia, DURACAO_REELS } from '../lib/socialReels.js';
import { calcularNumeroVida } from '../lib/calculos.js';

const HOJE = new Date(Date.UTC(2026, 10, 24));

test('acha a data de nascimento nos formatos comuns', () => {
  const casos = {
    'Nasci em 14/07/1990!': '1990-07-14',
    '12.03.85 aqui': '1985-03-12',
    '3-10-1988': '1988-10-03',
    'minha é 1/2/2001 kkk': '2001-02-01',
    '14 / 07 / 1990': '1990-07-14',
    '05/06/10': '2010-06-05', // ano curto até o ano corrente = 2000+
    '05/06/30': '1930-06-05', // depois disso = 1900+
    'a minha é 3 de outubro de 1988': '1988-10-03',
    '14 jul 1990': '1990-07-14',
    '29 de Março de 1975': '1975-03-29',
    '29/02/1996 e a do meu marido 05/06/1994': '1996-02-29', // a 1ª
  };
  for (const [texto, esperado] of Object.entries(casos)) assert.equal(dataNoComentario(texto, HOJE), esperado, texto);
});

test('ignora o que não é data de nascimento', () => {
  for (const t of ['amei esse post', '31/02/1990', '29/02/1995', '10/13/1990', '01/01/2030', '01/01/1850', 'meu número é 7', 'R$ 12.50', 'às 14:30', '1234567']) {
    assert.equal(dataNoComentario(t, HOJE), null, t);
  }
});

test('ofensivo, ataque ou link: não responde', () => {
  for (const t of ['isso é golpe 01/01/1990', 'charlatã 02/02/1992', 'vtnc', 'Que MERDA', 'vem ver www.site.com 01/01/1990', 'https://x.co 01/01/1990']) assert.ok(ehOfensivo(t), t);
  for (const t of ['Nasci em 14/07/1990!', 'amei', 'cumprimento a todos 01/01/1990', 'curioso 05/05/1995']) assert.ok(!ehOfensivo(t), t);
});

test('resposta: número certo, 4 modelos diferentes, chamada no fim', () => {
  const textos = new Set();
  for (let m = 0; m < 4; m++) {
    const r = respostaParaData('1990-07-14', m);
    assert.equal(r.numero, calcularNumeroVida('1990-07-14'));
    assert.ok(r.texto.endsWith(CTA_RESPOSTA));
    assert.ok(r.texto.includes(String(r.numero)));
    assert.ok(r.texto.length < 300);
    textos.add(r.texto);
  }
  assert.equal(textos.size, 4);
  assert.match(respostaParaData('2000-01-08', 0).texto, /^Seu número de vida é 11 \(número mestre\)/); // 2+1+8 = 11
});

test('modelo varia pelo id do comentário e é estável', () => {
  const modelos = new Set(Array.from({ length: 40 }, (_, k) => modeloDaResposta(`1789${k}`)));
  assert.ok(modelos.size >= 3);
  assert.equal(modeloDaResposta('abc'), modeloDaResposta('abc'));
  for (const m of modelos) assert.ok(m >= 0 && m <= 3);
});

test('decide: própria conta, ofensivo, sem data, com data', () => {
  assert.deepEqual(decidirResposta({ id: '1', texto: '14/07/1990', proprio: true }, HOJE), { responder: false, motivo: 'da própria conta' });
  assert.equal(decidirResposta({ id: '1', texto: 'golpe 14/07/1990' }, HOJE).motivo, 'ofensivo ou spam');
  assert.equal(decidirResposta({ id: '1', texto: 'lindo' }, HOJE).motivo, 'sem data');
  const ok = decidirResposta({ id: '1', texto: 'Nasci 14/07/1990' }, HOJE);
  assert.equal(ok.responder, true);
  assert.ok(ok.texto.includes(String(calcularNumeroVida('1990-07-14'))));
});

test('Reels: roteiro de 9s com céu, gancho, virada, chamada e trilha', () => {
  const urls = { ceu: 'https://x/ceu.jpg', r1: 'https://x/r1.png', r2: 'https://x/r2.png', r3: 'https://x/r3.png' };
  const r = roteiroReels({ urls, trilha: 'https://x/trilha.mp3' });
  assert.equal(r.output_format, 'mp4');
  assert.equal(r.width, 1080);
  assert.equal(r.height, 1920);
  assert.equal(r.duration, DURACAO_REELS);
  assert.ok(DURACAO_REELS >= 7 && DURACAO_REELS <= 10);
  const imgs = r.elements.filter((e) => e.type === 'image');
  assert.deepEqual(imgs.map((e) => e.source), [urls.ceu, urls.r1, urls.r2, urls.r3]);
  assert.equal(imgs[0].animations[0].type, 'scale'); // céu com zoom lento
  for (let k = 2; k < imgs.length; k++) assert.ok(imgs[k].time >= imgs[k - 1].time + imgs[k - 1].duration - 0.01, 'textos em sequência, sem sobrepor');
  assert.ok(imgs.every((e) => e.time + e.duration <= DURACAO_REELS + 1e-9));
  const audio = r.elements.find((e) => e.type === 'audio');
  assert.equal(audio.source, 'https://x/trilha.mp3');
  assert.ok(audio.audio_fade_out > 0);
  assert.equal(roteiroReels({ urls }).elements.some((e) => e.type === 'audio'), false);
});

test('Reels: trilha alterna pelo dia e ignora o que não é https', () => {
  const lista = 'https://a/1.mp3, https://a/2.mp3,https://a/3.mp3 http://inseguro/4.mp3';
  const dias = ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'].map((d) => trilhaDoDia(d, lista));
  assert.equal(new Set(dias).size, 3);
  assert.ok(dias.every((t) => t.startsWith('https://')));
  assert.equal(trilhaDoDia('2026-12-01', ''), null);
});
