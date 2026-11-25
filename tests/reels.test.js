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

test('trilhas do repositório: arquivos existem, rodízio pelo dia, SOCIAL_TRILHAS tem prioridade', async () => {
  const { existsSync, statSync } = await import('node:fs');
  const { TRILHAS_DO_REPOSITORIO, itemDoDia } = await import('../lib/reelsVideo.js');
  const { trilhaDoDia } = await import('../lib/socialReels.js');
  assert.ok(TRILHAS_DO_REPOSITORIO.length >= 3);
  for (const nome of TRILHAS_DO_REPOSITORIO) {
    const caminho = new URL(`../scripts/reels/trilhas/${nome}`, import.meta.url);
    assert.ok(existsSync(caminho), `falta ${nome}`);
    assert.ok(statSync(caminho).size < 1024 * 1024, `${nome} pesado demais pro repositório`);
  }
  const semana = ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'].map((d) => itemDoDia(d, TRILHAS_DO_REPOSITORIO));
  assert.equal(new Set(semana).size, 4, '4 dias seguidos, 4 trilhas diferentes');
  assert.equal(itemDoDia('2026-12-01', []), null);
  assert.equal(trilhaDoDia('2026-12-01', ''), null, 'sem SOCIAL_TRILHAS, o GitHub usa a do repositório');
  assert.equal(trilhaDoDia('2026-12-01', 'https://x/a.mp3'), 'https://x/a.mp3');
});

// ── Reels NARRADO (lib/reelsRoteiro.js + gerarRoteiroReels) ─────────────────
import {
  contarPalavras, fechamentoDoDia, FECHAMENTOS, ancorasDoDia, praticaTemGatilho, textoNarrado, normalizarRoteiro, validarRoteiro,
  palavrasDoAlinhamento, blocosDaLegenda, legendaNoTempo, duracaoDoVideo, PALAVRAS_MIN, PALAVRAS_MAX,
} from '../lib/reelsRoteiro.js';
import { problemasDoTexto, CHECKLIST_REVISAO_REELS } from '../lib/socialEditorial.js';
import { gerarRoteiroReels, lerRevisaoRoteiro } from '../lib/socialIA.js';
import { dadosDoDia } from '../lib/social.js';

// 26/11/2026: dia universal 2, Lua Cheia em Câncer
const DADOS_26 = dadosDoDia('2026-11-26', 0);
const SALVA = { tipo: 'salva', texto: FECHAMENTOS.salva };
const brutoBom = (ajuste = (x) => x) => ajuste({
  ganchos: [
    'Hoje alguém vai te pedir algo e você vai dizer sim antes de pensar.',
    'Hoje você vai sentir vontade de agradar alguém que nem pediu nada.',
    'Hoje uma conversa simples vai mexer mais com você do que deveria.',
  ],
  porque: 'Isso tem nome na psicologia: a mente prefere evitar o desconforto do não, e responde rápido pra encerrar a tensão. Simbolicamente, o dia universal 2 é o número da parceria, e a Lua Cheia em Câncer aumenta a vontade de cuidar dos outros.',
  virada: 'Dizer sim rápido não é gentileza: é pressa de se livrar do incômodo.',
  pratica: 'Quando alguém te pedir algo hoje, respire uma vez e diga: me deixa ver e te respondo.',
  legenda: { gancho: 'Hoje alguém vai te pedir algo e você vai dizer sim antes de pensar.', texto: ['Dizer sim rápido é pressa de encerrar o desconforto.', 'Dia universal 2 e Lua Cheia em Câncer: vontade de cuidar dos outros.', 'Hoje, antes de responder, respire e diga: me deixa ver.'] },
});
const ctx = { energia: DADOS_26.energia, problemasDoTexto };

test('narrado: contagem de palavras e fechamento alternado por dia', () => {
  assert.equal(contarPalavras('Hoje é dia universal 2 — e a Lua, cheia.'), 9);
  const tipos = ['2026-11-26', '2026-11-27', '2026-11-28'].map((d) => fechamentoDoDia(d).tipo);
  assert.ok(tipos.every((t) => t === 'salva' || t === 'manda'), 'sem resposta automática, nada de "comenta"');
  assert.equal(new Set(tipos).size, 2);
  const com = ['2026-11-26', '2026-11-27', '2026-11-28'].map((d) => fechamentoDoDia(d, { comentarios: true }).tipo);
  assert.deepEqual(new Set(com), new Set(['comenta', 'salva', 'manda']), '3 dias seguidos, 3 fechamentos');
  assert.equal(fechamentoDoDia('2026-11-26', { comentarios: true }).texto, FECHAMENTOS[com[0]]);
});

test('narrado: prática precisa de gatilho + ação; âncora no dado do dia', () => {
  assert.ok(praticaTemGatilho('Quando alguém te pedir algo hoje, respire uma vez e diga: me deixa ver.'));
  assert.ok(praticaTemGatilho('Na próxima vez que for responder no automático, conte até 3 e pergunte: isso é meu ou é medo?'));
  assert.ok(!praticaTemGatilho('Respire fundo antes de responder hoje.'), 'sem gatilho');
  assert.ok(!praticaTemGatilho('Quando der, pense nisso.'), 'gatilho vago, ação curta');
  const a = ancorasDoDia(DADOS_26.energia);
  const ok = (t) => a.some((x) => x.testa(t));
  assert.ok(ok('Simbolicamente, o dia universal 2 é parceria.'));
  assert.ok(ok('O dia universal de hoje é dois.'));
  assert.ok(ok('A Lua Cheia pede pausa.'));
  assert.ok(!ok('O dia universal 7 pede silêncio.'), 'número errado não vale');
  assert.ok(!ok('Hoje o universo pede calma.'));
});

test('narrado: roteiro bom passa; total de 80 a 95 palavras com o fechamento', () => {
  const r = normalizarRoteiro(brutoBom(), { fechamento: SALVA, escolhido: 1 });
  assert.equal(r.gancho, brutoBom().ganchos[1]);
  assert.equal(r.fechamento, FECHAMENTOS.salva);
  const v = validarRoteiro(r, ctx);
  assert.ok(v.ok, v.problemas.join('; '));
  assert.ok(v.palavras >= PALAVRAS_MIN && v.palavras <= PALAVRAS_MAX, `${v.palavras}`);
  const texto = textoNarrado(r);
  assert.ok(texto.startsWith(r.gancho) && texto.endsWith(FECHAMENTOS.salva));
});

test('narrado: validação pega gancho pergunta/sem hoje, prática sem gatilho, sem âncora, tamanho e proibidos', () => {
  const problemas = (ajuste) => validarRoteiro(normalizarRoteiro(brutoBom(ajuste), { fechamento: SALVA }), ctx).problemas.join(' | ');
  assert.match(problemas((b) => { b.ganchos[0] = 'Hoje você vai dizer sim pra quem?'; return b; }), /gancho 1 é pergunta/);
  assert.match(problemas((b) => { b.ganchos[2] = 'Alguém vai te pedir algo e você vai aceitar.'; return b; }), /gancho 3 não fala de hoje/);
  assert.match(problemas((b) => { b.pratica = 'Respire fundo e diga que vai pensar com calma antes.'; return b; }), /prática sem gatilho/);
  assert.match(problemas((b) => { b.porque = b.porque.replace('o dia universal 2', 'o dia').replace('a Lua Cheia em Câncer', 'o céu'); return b; }), /não cita nenhum dado do dia/);
  assert.match(problemas((b) => { b.porque += ' E isso se repete muito em quem vive cuidando de todo mundo ao redor sem parar nunca.'; return b; }), /palavras no total/);
  assert.match(problemas((b) => { b.virada = 'Talvez dizer sim rápido seja só pressa de se livrar do incômodo.'; return b; }), /hedge no texto falado/);
  assert.match(problemas((b) => { b.ganchos = b.ganchos.slice(0, 2); return b; }), /3 ganchos/);
});

// alinhamento falso: cada caractere dura 0,05s
function alinhamento(texto) {
  const chars = [...texto];
  return { characters: chars, character_start_times_seconds: chars.map((_, i) => i * 0.05), character_end_times_seconds: chars.map((_, i) => (i + 1) * 0.05) };
}

test('narrado: tempo de cada palavra a partir do alinhamento por caractere', () => {
  const p = palavrasDoAlinhamento(alinhamento('Hoje é dia 2, viu?'));
  assert.deepEqual(p.map((x) => x.texto), ['Hoje', 'é', 'dia', '2,', 'viu?']);
  assert.deepEqual(p[0], { texto: 'Hoje', ini: 0, fim: 0.2 });
  assert.deepEqual(p[1], { texto: 'é', ini: 0.25, fim: 0.3 });
  assert.equal(p.at(-1).fim, 0.9);
  for (let i = 1; i < p.length; i++) assert.ok(p[i].ini >= p[i - 1].fim, 'em ordem, sem sobreposição');
  assert.deepEqual(palavrasDoAlinhamento(null), []);
  // vídeo = fala + ~1s, arredondado no quadro
  assert.equal(duracaoDoVideo(p), Math.ceil(1.9 * 30) / 30);
  assert.equal(duracaoDoVideo([{ texto: 'a', ini: 0, fim: 34.21 }]), Math.ceil(35.21 * 30) / 30);
});

test('narrado: blocos da legenda (até 4 palavras, quebra na pontuação) e a palavra acesa no tempo', () => {
  const texto = 'Hoje alguém vai te pedir algo importante. Respire uma vez antes, e responda devagar.';
  const p = palavrasDoAlinhamento(alinhamento(texto));
  const b = blocosDaLegenda(p);
  // cobre todas as palavras, em ordem, sem buraco
  assert.equal(b[0].de, 0);
  assert.equal(b.at(-1).ate, p.length - 1);
  for (let k = 1; k < b.length; k++) assert.equal(b[k].de, b[k - 1].ate + 1);
  for (const x of b) {
    assert.ok(x.ate - x.de + 1 <= 4, 'no máximo 4 palavras');
    const linha = p.slice(x.de, x.ate + 1).map((w) => w.texto).join(' ');
    assert.ok(linha.length <= 24 || x.ate === x.de, `bloco grande: ${linha}`);
  }
  const fimDeFrase = b.findIndex((x) => p[x.ate].texto === 'importante.');
  assert.ok(fimDeFrase >= 0, 'quebra depois do ponto');
  assert.equal(p[b[fimDeFrase + 1].de].texto, 'Respire');
  // no tempo
  assert.deepEqual(legendaNoTempo(b, p, -0.1), { bloco: -1, palavra: -1 });
  assert.deepEqual(legendaNoTempo(b, p, 0), { bloco: 0, palavra: 0 });
  const i = p.findIndex((w) => w.texto === 'Respire');
  assert.equal(legendaNoTempo(b, p, p[i].ini + 0.01).palavra, i);
  assert.equal(legendaNoTempo(b, p, 999).palavra, p.length - 1, 'depois da fala, a última palavra fica acesa');
  for (const x of b) assert.ok(x.fim > x.ini);
});

test('narrado (IA): revisão escolhe o gancho mais específico; prompt leva checklist, fechamento e dados do dia', async () => {
  const pedidos = [];
  const chamar = async (sistema, usuario) => {
    pedidos.push({ sistema, usuario });
    return pedidos.length === 1 ? brutoBom() : { aprovado: true, problemas: [], gancho_escolhido: 2, conteudo: brutoBom() };
  };
  const { roteiro, revisao } = await gerarRoteiroReels(DADOS_26, { chamar, fechamento: SALVA });
  assert.ok(roteiro, JSON.stringify(revisao));
  assert.equal(roteiro.gancho, brutoBom().ganchos[2]);
  assert.equal(roteiro.fonte, 'ia');
  assert.equal(roteiro.fechamento, FECHAMENTOS.salva);
  assert.ok(pedidos[0].sistema.includes('ESTE TEXTO É FALADO'));
  assert.ok(pedidos[0].usuario.includes('"dia_universal": 2'));
  assert.ok(pedidos[0].usuario.includes(`FECHAMENTO FIXO: ${FECHAMENTOS.salva}`));
  assert.ok(pedidos[1].sistema.includes(CHECKLIST_REVISAO_REELS));
  assert.match(pedidos[1].usuario, /"gancho_escolhido": 0, 1 ou 2/);
  assert.match(pedidos[1].usuario, /Contagem atual \(com o gancho 1 e o fechamento\): \d+ palavras/);
});

test('narrado (IA): reescrita corrige na 2ª rodada; sem conserto ou IA fora do ar → null (cai no card de 9s)', async () => {
  // rascunho sem gatilho na prática; 1ª revisão aprova sem mexer (a checagem local reprova); 2ª corrige
  const ruim = brutoBom((b) => { b.pratica = 'Respire fundo e diga que vai pensar com calma antes.'; return b; });
  let n = 0;
  const pedidos = [];
  const chamar = async (s, u) => {
    pedidos.push(u);
    n += 1;
    if (n === 1) return ruim;
    if (n === 2) return { aprovado: false, problemas: ['prática'], gancho_escolhido: 0, conteudo: ruim };
    return { aprovado: false, problemas: ['prática'], gancho_escolhido: 1, conteudo: brutoBom() };
  };
  const { roteiro } = await gerarRoteiroReels(DADOS_26, { chamar, fechamento: SALVA });
  assert.equal(n, 3);
  assert.match(pedidos[2], /prática sem gatilho/, 'a 2ª rodada recebe o que a checagem ainda achou');
  assert.equal(roteiro.fonte, 'ia-revisada');
  assert.equal(roteiro.gancho, brutoBom().ganchos[1]);

  let k = 0;
  const nunca = async () => (++k === 1 ? ruim : { aprovado: false, problemas: ['x'], gancho_escolhido: 0, conteudo: ruim });
  const r2 = await gerarRoteiroReels(DADOS_26, { chamar: nunca, fechamento: SALVA });
  assert.equal(r2.roteiro, null);
  assert.ok(r2.revisao.checagem.some((p) => /gatilho/.test(p)));
  assert.equal((await gerarRoteiroReels(DADOS_26, { chamar: async () => null, fechamento: SALVA })).roteiro, null);
  assert.equal((await gerarRoteiroReels(DADOS_26, { chamar: async () => { throw new Error('fora do ar'); }, fechamento: SALVA })).roteiro, null);
  // revisão quebrada: o rascunho só vale se passou na checagem local
  let j = 0;
  const semRev = async () => (++j === 1 ? brutoBom() : 'texto solto');
  assert.equal((await gerarRoteiroReels(DADOS_26, { chamar: semRev, fechamento: SALVA })).roteiro.fonte, 'ia');
  assert.deepEqual(lerRevisaoRoteiro({ ganchos: ['a'], gancho_escolhido: '1' }).escolhido, 1);
});

test('narrado (ffmpeg): voz cheia + trilha a −20 dB repetida com fade, duração = fala + ~1s, MP4 de Reels', async () => {
  const { argumentosFfmpegNarrado, VOLUME_TRILHA_DB } = await import('../lib/reelsVideo.js');
  const a = argumentosFfmpegNarrado({ padraoQuadros: '/q/q%04d.jpg', narracao: '/n.mp3', trilha: '/t.mp3', saida: '/r.mp4', duracao: 35.2 });
  const par = (k) => a[a.indexOf(k) + 1];
  assert.equal(VOLUME_TRILHA_DB, -20);
  assert.deepEqual(a.filter((x, i) => a[i - 1] === '-i'), ['/q/q%04d.jpg', '/n.mp3', '/t.mp3']);
  assert.deepEqual(a.slice(a.indexOf('/t.mp3') - 3, a.indexOf('/t.mp3')), ['-stream_loop', '-1', '-i'], 'trilha de 20s repete até o fim');
  const f = par('-filter_complex');
  assert.match(f, /\[2:a\][^;]*volume=-20dB/);
  assert.match(f, /afade=t=in:st=0:d=1/);
  assert.match(f, /afade=t=out:st=33\.20:d=2/);
  assert.match(f, /amix=inputs=2:duration=first:dropout_transition=0:normalize=0/, 'a voz não perde volume na mistura');
  assert.equal(par('-map'), '0:v:0');
  assert.equal(par('-t'), '35.2');
  for (const [k, v] of [['-c:v', 'libx264'], ['-preset', 'veryfast'], ['-pix_fmt', 'yuv420p'], ['-r', '30'], ['-c:a', 'aac'], ['-ar', '48000'], ['-movflags', '+faststart']]) assert.equal(par(k), v, k);
  assert.ok(!a.includes('-shortest'), 'o vídeo manda no tempo, não o áudio');
  const semTrilha = argumentosFfmpegNarrado({ padraoQuadros: '/q/q%04d.jpg', narracao: '/n.mp3', saida: '/r.mp4', duracao: 30 });
  assert.ok(!semTrilha.includes('-stream_loop'));
  assert.doesNotMatch(semTrilha[semTrilha.indexOf('-filter_complex') + 1], /amix/);
});

test('narrado (ElevenLabs): pedido com timestamps, áudio + alinhamento, erros claros, limite do mês', async () => {
  const { narrar, limiteMensal, cabeNoLimite, LIMITE_MES_PADRAO, mesBrasilia } = await import('../lib/elevenlabs.js');
  const pedidos = [];
  const fetchFn = async (url, o) => {
    pedidos.push({ url, o, corpo: JSON.parse(o.body) });
    return { ok: true, json: async () => ({ audio_base64: Buffer.from('mp3').toString('base64'), alignment: { characters: ['O', 'i', '.'], character_start_times_seconds: [0, 0.1, 0.2], character_end_times_seconds: [0.1, 0.2, 0.35] } }) };
  };
  const r = await narrar({ texto: 'Oi.', apiKey: 'k', voiceId: 'v 1', fetchFn });
  assert.equal(pedidos[0].url, 'https://api.elevenlabs.io/v1/text-to-speech/v%201/with-timestamps?output_format=mp3_44100_128');
  assert.equal(pedidos[0].o.headers['xi-api-key'], 'k');
  assert.equal(pedidos[0].corpo.model_id, 'eleven_multilingual_v2');
  assert.equal(r.audio.toString(), 'mp3');
  assert.equal(r.duracao, 0.35);
  assert.equal(r.caracteres, 3);
  await assert.rejects(narrar({ texto: 'x', apiKey: '', voiceId: 'v', fetchFn }), /ELEVENLABS_API_KEY/);
  await assert.rejects(narrar({ texto: 'x', apiKey: 'k', voiceId: 'v', fetchFn: async () => ({ ok: false, status: 401, json: async () => ({ detail: { message: 'Invalid API key' } }) }) }), /ElevenLabs: Invalid API key/);
  await assert.rejects(narrar({ texto: 'x', apiKey: 'k', voiceId: 'v', fetchFn: async () => ({ ok: true, json: async () => ({ audio_base64: 'AA==' }) }) }), /alinhamento/);
  await assert.rejects(narrar({ texto: 'x', apiKey: 'k', voiceId: 'v', fetchFn: async () => { throw new Error('rede'); } }), /sem resposta/);
  assert.equal(limiteMensal(undefined), LIMITE_MES_PADRAO);
  assert.equal(LIMITE_MES_PADRAO, 25000);
  assert.equal(limiteMensal('12000'), 12000);
  assert.equal(limiteMensal('abc'), 25000);
  assert.ok(cabeNoLimite({ usado: 24000, texto: 'x'.repeat(1000), limite: 25000 }));
  assert.ok(!cabeNoLimite({ usado: 24000, texto: 'x'.repeat(1001), limite: 25000 }));
  assert.equal(mesBrasilia(Date.parse('2026-12-01T02:00:00Z')), '2026-11', 'meia-noite em Brasília ainda é o mês anterior em UTC−3');
});
