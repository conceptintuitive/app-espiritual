// Testes do Reels feito no GitHub Actions: linha do tempo da animação
// (lib/reelsAnimacao.js) e argumentos do ffmpeg (lib/reelsVideo.js) — `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoNoTempo, totalQuadros, tempoDoQuadro, REELS, CAMADAS } from '../lib/reelsAnimacao.js';
import { argumentosFfmpeg } from '../lib/reelsVideo.js';
import { roteiroReels } from '../lib/socialReels.js';

const visiveis = (t) => estadoNoTempo(t).camadas.filter((c) => c.opacidade > 0.5).map((c) => c.id);

test('formato: 9s, 30fps, 1080x1920 = 270 quadros', () => {
  assert.deepEqual(REELS, { duracao: 9, fps: 30, largura: 1080, altura: 1920 });
  assert.equal(totalQuadros(), 270);
  assert.equal(tempoDoQuadro(0), 0);
  assert.equal(tempoDoQuadro(269), 269 / 30);
});

test('linha do tempo: céu sozinho, gancho, virada, chamada até o fim', () => {
  assert.deepEqual(visiveis(0), []);
  assert.deepEqual(visiveis(2), ['r1']);
  assert.deepEqual(visiveis(4.5), []); // troca
  assert.deepEqual(visiveis(6), ['r2']);
  assert.deepEqual(visiveis(8), ['r3']);
  assert.deepEqual(visiveis(tempoDoQuadro(269)), ['r3'], 'a chamada fica até o último quadro');
  for (let i = 0; i < totalQuadros(); i++) assert.ok(visiveis(tempoDoQuadro(i)).length <= 1, `dois textos ao mesmo tempo no quadro ${i}`);
});

test('entrada sobe e acende; saída apaga; zoom do céu só cresce', () => {
  const r1 = (t) => estadoNoTempo(t).camadas.find((c) => c.id === 'r1');
  assert.ok(r1(0.5).opacidade < r1(0.9).opacidade);
  assert.ok(r1(0.5).deslocY > r1(1.0).deslocY);
  assert.equal(r1(1.5).deslocY, 0);
  assert.ok(r1(4.3).opacidade < r1(4.0).opacidade);
  let antes = 0;
  for (let i = 0; i < totalQuadros(); i++) {
    const e = estadoNoTempo(tempoDoQuadro(i)).escalaCeu;
    assert.ok(e >= antes);
    antes = e;
  }
  assert.equal(estadoNoTempo(0).escalaCeu, 1);
  assert.equal(estadoNoTempo(9).escalaCeu, 1.12);
});

test('ffmpeg: H.264 veryfast, yuv420p, 30fps, AAC 48 kHz, faststart, 9s', () => {
  const a = argumentosFfmpeg({ padraoQuadros: '/tmp/q%04d.jpg', trilha: '/tmp/t.mp3', saida: '/tmp/r.mp4' });
  const par = (k) => a[a.indexOf(k) + 1];
  assert.equal(par('-c:v'), 'libx264');
  assert.equal(par('-preset'), 'veryfast');
  assert.equal(par('-pix_fmt'), 'yuv420p');
  assert.equal(par('-framerate'), '30');
  assert.equal(par('-r'), '30');
  assert.equal(par('-t'), '9');
  assert.equal(par('-c:a'), 'aac');
  assert.equal(par('-ar'), '48000');
  assert.equal(par('-movflags'), '+faststart');
  assert.equal(par('-stream_loop'), '-1', 'trilha curta repete');
  assert.match(par('-af'), /afade=t=out:st=7\.5:d=1\.5/);
  assert.equal(a.at(-1), '/tmp/r.mp4');
  const mudo = argumentosFfmpeg({ padraoQuadros: '/tmp/q%04d.jpg', saida: '/tmp/r.mp4' });
  assert.ok(mudo.includes('anullsrc=channel_layout=stereo:sample_rate=48000'), 'sem trilha, áudio mudo');
  assert.ok(!mudo.includes('-af'));
});

test('Creatomate (alternativa) segue a mesma linha do tempo', () => {
  const r = roteiroReels({ urls: { ceu: 'c', r1: 'a', r2: 'b', r3: 'd' } });
  const textos = r.elements.filter((e) => e.type === 'image').slice(1);
  assert.deepEqual(textos.map((e) => e.time), CAMADAS.map((c) => c.inicio));
  assert.deepEqual(textos.map((e) => Math.round((e.time + e.duration) * 10) / 10), CAMADAS.map((c) => c.fim));
  assert.equal(r.elements[0].animations[0].end_scale, '112%');
});
