#!/usr/bin/env node
// scripts/reels/gerar.mjs — o Reels diário, de graça, no GitHub Actions
// (.github/workflows/reels.yml). Passos:
//   1. GET  {SITE_URL}/api/social/reels/trabalho   o que fazer hoje: a página da
//      animação (assinada), a trilha e uma URL de upload assinada do Supabase
//      Storage (o GitHub não precisa de chave do Supabase). Se o Reels de hoje
//      já saiu, ou o motor não é o GitHub, para aqui.
//   2. Playwright abre a página com &captura=1 e fotografa os 270 quadros
//      (9s × 30fps, 1080x1920), chamando window.__quadro(t) em cada um.
//   3. ffmpeg monta o MP4 (H.264 veryfast, AAC 48 kHz, faststart) com a trilha:
//      a de SOCIAL_TRILHAS (URL), se houver; senão, a do repositório do dia
//      (scripts/reels/trilhas, rodízio).
//   4. PUT do MP4 na URL assinada (bucket público "reels").
//   5. POST {SITE_URL}/api/social/reels/publicar   o site cria o Reels no
//      Instagram com a URL pública do vídeo (trava de 1 por dia lá).
// Reels NARRADO (SOCIAL_REELS_NARRADO=on na Vercel): o trabalho vem com
// narrado: true, a duração (fala + ~1s) e a narração (MP3 + tempo de cada
// palavra). A página é filmada no modo narrado (window.__carregar entrega a
// narração) e o ffmpeg mistura a voz com a trilha a −20 dB. Se qualquer passo
// do narrado falhar aqui, pede o trabalho de novo com &card=1 e faz o card de
// 9s: o dia nunca fica sem Reels.
// Reels INTERATIVO (SOCIAL_REELS_INTERATIVO=on): o trabalho vem com
// interativo: 'carta'|'pausa'|'numero' e a narração em trechos (vozes, cada
// uma com o segundo em que entra). Mesma filmagem; o ffmpeg põe cada trecho no
// seu tempo. Falhou aqui = pede &narrado=1 (o narrado do dia) e, se esse
// também falhar, &card=1.
// Variáveis: SITE_URL, CRON_SECRET (secret do repositório), DATA (opcional,
// AAAA-MM-DD; vazio = hoje em Brasília), PREVIA ("sim" = Reels narrado de
// prévia, salvo como AAAA-MM-DD-previa.mp4 e NUNCA publicado), FORMATO (só com
// PREVIA: carta, pausa, numero ou narrado; vazio = o formato do dia).
//
// Teste local, sem servidor de verdade (só filma e monta):
//   PAGINA_URL='http://localhost:3000/social/reels/…' SAIDA=/tmp/r.mp4 [TRILHA=/tmp/t.mp3] node gerar.mjs --local
//   narrado: + NARRACAO_JSON=/tmp/n.json ({ palavras, duracao }) NARRACAO_MP3=/tmp/n.mp3
//   interativo: + NARRACAO_JSON=/tmp/i.json ({ formato, cena, eventos, palavras,
//     duracao, vozes: [{ arquivo: '/tmp/v0.mp3', inicio }] }), sem NARRACAO_MP3

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, writeFile, readFile, rm, stat, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REELS, totalQuadros, tempoDoQuadro, quadrosDe } from '../../lib/reelsAnimacao.js';
import { argumentosFfmpeg, argumentosFfmpegNarrado, TRILHAS_DO_REPOSITORIO, itemDoDia } from '../../lib/reelsVideo.js';

const AQUI = dirname(fileURLToPath(import.meta.url));

const SITE = String(process.env.SITE_URL || '').replace(/\/+$/, '');
const SEGREDO = process.env.CRON_SECRET || '';
const DATA = String(process.env.DATA || '').trim();
const PREVIA = /^(sim|true|1|on)$/i.test(String(process.env.PREVIA || '').trim());
const FORMATO = String(process.env.FORMATO || '').trim().toLowerCase(); // só na prévia
const LOCAL = process.argv.includes('--local');
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function api(caminho, { method = 'GET', body } = {}) {
  const res = await fetch(`${SITE}${caminho}`, {
    method,
    headers: { Authorization: `Bearer ${SEGREDO}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${caminho}: HTTP ${res.status} ${json.error || ''}`.trim());
  return json;
}

/**
 * Filma a página quadro a quadro. narracao = { palavras, duracao } no modo
 * narrado (entregue por window.__carregar); sem ela, os 270 quadros do card.
 */
async function capturar(pagina, pasta, { narracao = null, duracao = REELS.duracao } = {}) {
  const navegador = await chromium.launch();
  try {
    const p = await navegador.newPage({ viewport: { width: REELS.largura, height: REELS.altura }, deviceScaleFactor: 1 });
    // aviso de cookies respondido "só o essencial": sem medição, sem banner
    await p.addInitScript(() => { try { localStorage.setItem('ic_consent', 'nao'); } catch { /* */ } });
    const url = `${pagina}${pagina.includes('?') ? '&' : '?'}captura=1`;
    const r = await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    if (!r || !r.ok()) throw new Error(`a página da animação respondeu ${r ? r.status() : 'nada'}`);
    if (narracao) {
      await p.waitForFunction(() => typeof window.__carregar === 'function', null, { timeout: 60000 });
      await p.evaluate((n) => window.__carregar(n), narracao);
    }
    await p.waitForFunction(() => window.__pronto === true, null, { timeout: 90000 });
    const n = narracao ? quadrosDe(duracao) : totalQuadros();
    for (let i = 0; i < n; i++) {
      await p.evaluate((t) => window.__quadro(t), tempoDoQuadro(i));
      const foto = await p.screenshot({ type: 'jpeg', quality: 92 });
      await writeFile(join(pasta, `q${String(i).padStart(4, '0')}.jpg`), foto);
      if (i % 90 === 0) log(`quadro ${i}/${n}`);
    }
    log(`${n} quadros capturados`);
  } finally {
    await navegador.close();
  }
}

function ffmpeg(args) {
  return new Promise((ok, falha) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    proc.on('error', falha);
    proc.on('close', (code) => (code === 0 ? ok() : falha(new Error(`ffmpeg saiu com código ${code}`))));
  });
}

async function baixar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`trilha: HTTP ${r.status} em ${url}`);
  await writeFile(destino, Buffer.from(await r.arrayBuffer()));
}

/** Trilha do dia guardada em scripts/reels/trilhas (rodízio), ou null se faltar o arquivo. */
async function trilhaDoRepositorio(data) {
  const nome = itemDoDia(data, TRILHAS_DO_REPOSITORIO);
  if (!nome) return null;
  const caminho = join(AQUI, 'trilhas', nome);
  try {
    await access(caminho);
    return caminho;
  } catch {
    return null;
  }
}

async function montar({ pasta, trilha, saida, vozes = null, duracao }) {
  const padraoQuadros = join(pasta, 'q%04d.jpg');
  await ffmpeg(vozes?.length
    ? argumentosFfmpegNarrado({ padraoQuadros, vozes, trilha, saida, duracao })
    : argumentosFfmpeg({ padraoQuadros, trilha, saida }));
  const { size } = await stat(saida);
  log(`MP4 pronto: ${(size / 1024 / 1024).toFixed(1)} MB`);
}

async function limparQuadros(pasta) {
  for (const f of await readdir(pasta)) if (/^q\d+\.jpg$/.test(f)) await rm(join(pasta, f), { force: true });
}

/** Narrado ou interativo: baixa os trechos de voz, filma e monta. */
async function fazerNarrado(trabalho, { pasta, trilha, saida }) {
  const n = trabalho.narracao;
  const lista = n.vozes?.length ? n.vozes : [{ audio: n.audio, inicio: 0 }];
  const vozes = [];
  for (const [k, v] of lista.entries()) {
    const caminho = join(pasta, `voz-${k}.mp3`);
    await baixar(v.audio, caminho);
    vozes.push({ caminho, inicio: Number(v.inicio) || 0 });
  }
  await capturar(trabalho.pagina, pasta, { narracao: n, duracao: trabalho.duracao });
  await montar({ pasta, trilha, saida, vozes, duracao: trabalho.duracao });
}

async function subir(upload, arquivo) {
  const corpo = await readFile(arquivo);
  const headers = { 'content-type': 'video/mp4', 'x-upsert': 'true', 'cache-control': 'max-age=3600' };
  if (upload.apikey) Object.assign(headers, { apikey: upload.apikey, authorization: `Bearer ${upload.apikey}` });
  const r = await fetch(upload.url, { method: 'PUT', headers, body: corpo });
  if (!r.ok) throw new Error(`upload no Supabase: HTTP ${r.status} ${(await r.text().catch(() => '')).slice(0, 200)}`);
  log(`enviado: ${upload.caminho}`);
}

async function principal() {
  const pasta = await mkdtemp(join(tmpdir(), 'reels-'));
  try {
    if (LOCAL) {
      const pagina = process.env.PAGINA_URL;
      if (!pagina) throw new Error('PAGINA_URL é obrigatória no --local');
      const narracao = process.env.NARRACAO_JSON ? JSON.parse(await readFile(process.env.NARRACAO_JSON, 'utf8')) : null;
      // interativo: a duração já vem pronta da linha do tempo; narrado: fala + ~1s
      const duracao = narracao ? Number(process.env.DURACAO || narracao.duracaoVideo || (narracao.formato ? narracao.duracao : narracao.duracao + 1)) : REELS.duracao;
      await capturar(pagina, pasta, { narracao, duracao });
      const trilha = process.env.TRILHA || (process.env.DATA ? await trilhaDoRepositorio(process.env.DATA) : null);
      const vozes = narracao?.vozes?.length
        ? narracao.vozes.map((v) => ({ caminho: v.arquivo, inicio: Number(v.inicio) || 0 }))
        : narracao ? [{ caminho: process.env.NARRACAO_MP3, inicio: 0 }] : null;
      await montar({ pasta, trilha, saida: process.env.SAIDA || join(process.cwd(), 'reels.mp4'), vozes, duracao });
      return;
    }
    if (!SITE || !SEGREDO) throw new Error('SITE_URL e CRON_SECRET são obrigatórios');

    const q = new URLSearchParams();
    if (DATA) q.set('data', DATA);
    if (PREVIA) q.set('previa', '1');
    if (PREVIA && FORMATO) q.set('formato', FORMATO);
    let trabalho = await api(`/api/social/reels/trabalho${q.size ? `?${q}` : ''}`);
    if (trabalho.pular) { log(`nada a fazer: ${trabalho.pular}`); return; }
    if (trabalho.aviso) log(`aviso: ${trabalho.aviso}`);
    const tipo = (t) => (t.interativo ? `interativo "${t.interativo}", ${t.duracao.toFixed(1)}s` : t.narrado ? `narrado, ${t.duracao.toFixed(1)}s` : 'card de 9s');
    log(`Reels de ${trabalho.data} (${tipo(trabalho)})${trabalho.previa ? ' · PRÉVIA, não publica' : ''}`);

    let trilha = null;
    if (trabalho.trilha) {
      trilha = join(pasta, 'trilha.mp3');
      await baixar(trabalho.trilha, trilha);
    } else {
      trilha = await trilhaDoRepositorio(trabalho.data);
    }
    log(`trilha: ${trilha ? trilha.split('/').pop() : 'nenhuma'}`);
    const saida = join(pasta, 'reels.mp4');

    // interativo → narrado → card: nunca fica sem post
    let feito = null;
    while (trabalho.narrado && !feito) {
      try {
        await fazerNarrado(trabalho, { pasta, trilha, saida });
        feito = trabalho.interativo ? 'interativo' : 'narrado';
      } catch (err) {
        if (trabalho.previa) throw err;
        const proximo = trabalho.interativo ? { narrado: '1' } : { card: '1' };
        log(`⚠️ ${trabalho.interativo ? 'interativo' : 'narrado'} falhou aqui (${err.message}); tentando o ${proximo.narrado ? 'narrado' : 'card de 9s'}`);
        await limparQuadros(pasta);
        const t2 = await api(`/api/social/reels/trabalho?${new URLSearchParams({ data: trabalho.data, ...proximo })}`);
        if (t2.pular) { log(`nada a fazer: ${t2.pular}`); return; }
        if (t2.aviso) log(`aviso: ${t2.aviso}`);
        trabalho = t2;
      }
    }
    if (!feito) {
      await capturar(trabalho.pagina, pasta);
      await montar({ pasta, trilha, saida });
    }
    await subir(trabalho.upload, saida);
    if (trabalho.previa) { log(`prévia pronta: ${trabalho.upload.caminho} (não vai pro Instagram)`); return; }
    const body = { data: trabalho.data, caminho: trabalho.upload.caminho, narrado: !!feito, ...(feito === 'interativo' && { interativo: trabalho.interativo }) };
    const r = await api('/api/social/reels/publicar', { method: 'POST', body });
    log(r.pulado ? `não publicado: ${r.pulado}` : `enviado pro Instagram (container ${r.container}); o site termina a publicação`);
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
}

principal().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
