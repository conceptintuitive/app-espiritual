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
// Variáveis: SITE_URL, CRON_SECRET (secret do repositório), DATA (opcional,
// AAAA-MM-DD; vazio = hoje em Brasília).
//
// Teste local, sem servidor de verdade (só filma e monta):
//   PAGINA_URL='http://localhost:3000/social/reels/…' SAIDA=/tmp/r.mp4 [TRILHA=/tmp/t.mp3] node gerar.mjs --local

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm, stat, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REELS, totalQuadros, tempoDoQuadro } from '../../lib/reelsAnimacao.js';
import { argumentosFfmpeg, TRILHAS_DO_REPOSITORIO, itemDoDia } from '../../lib/reelsVideo.js';

const AQUI = dirname(fileURLToPath(import.meta.url));

const SITE = String(process.env.SITE_URL || '').replace(/\/+$/, '');
const SEGREDO = process.env.CRON_SECRET || '';
const DATA = String(process.env.DATA || '').trim();
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

async function capturar(pagina, pasta) {
  const navegador = await chromium.launch();
  try {
    const p = await navegador.newPage({ viewport: { width: REELS.largura, height: REELS.altura }, deviceScaleFactor: 1 });
    // aviso de cookies respondido "só o essencial": sem medição, sem banner
    await p.addInitScript(() => { try { localStorage.setItem('ic_consent', 'nao'); } catch { /* */ } });
    const url = `${pagina}${pagina.includes('?') ? '&' : '?'}captura=1`;
    const r = await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    if (!r || !r.ok()) throw new Error(`a página da animação respondeu ${r ? r.status() : 'nada'}`);
    await p.waitForFunction(() => window.__pronto === true, null, { timeout: 90000 });
    const n = totalQuadros();
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

async function montar({ pasta, trilha, saida }) {
  await ffmpeg(argumentosFfmpeg({ padraoQuadros: join(pasta, 'q%04d.jpg'), trilha, saida }));
  const { size } = await stat(saida);
  log(`MP4 pronto: ${(size / 1024 / 1024).toFixed(1)} MB`);
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
      await capturar(pagina, pasta);
      const trilha = process.env.TRILHA || (process.env.DATA ? await trilhaDoRepositorio(process.env.DATA) : null);
      await montar({ pasta, trilha, saida: process.env.SAIDA || join(process.cwd(), 'reels.mp4') });
      return;
    }
    if (!SITE || !SEGREDO) throw new Error('SITE_URL e CRON_SECRET são obrigatórios');

    const trabalho = await api(`/api/social/reels/trabalho${DATA ? `?data=${encodeURIComponent(DATA)}` : ''}`);
    if (trabalho.pular) { log(`nada a fazer: ${trabalho.pular}`); return; }
    log(`Reels de ${trabalho.data}`);

    await capturar(trabalho.pagina, pasta);
    let trilha = null;
    if (trabalho.trilha) {
      trilha = join(pasta, 'trilha.mp3');
      await baixar(trabalho.trilha, trilha);
    } else {
      trilha = await trilhaDoRepositorio(trabalho.data);
    }
    log(`trilha: ${trilha ? trilha.split('/').pop() : 'nenhuma (vídeo mudo)'}`);
    const saida = join(pasta, 'reels.mp4');
    await montar({ pasta, trilha, saida });
    await subir(trabalho.upload, saida);
    const r = await api('/api/social/reels/publicar', { method: 'POST', body: { data: trabalho.data, caminho: trabalho.upload.caminho } });
    log(r.pulado ? `não publicado: ${r.pulado}` : `enviado pro Instagram (container ${r.container}); o site termina a publicação`);
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
}

principal().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
