// lib/socialReels.js — Reels diário via Creatomate: o motor ALTERNATIVO
// (SOCIAL_REELS=creatomate). O padrão é o GitHub Actions (SOCIAL_REELS=on, ver
// scripts/reels/gerar.mjs), de graça. SÓ SERVIDOR. Os dois seguem a mesma
// linha do tempo (lib/reelsAnimacao.js).
// O vídeo (9s, 1080x1920) é montado a partir das nossas próprias imagens:
//   ceu.jpg  o céu do dia (fundo), com zoom lento
//   r1.png   o gancho do carrossel do dia (texto, fundo transparente)
//   r2.png   a virada
//   r3.png   a chamada "Faz o seu mapa grátis: link na bio"
// O texto já vem desenhado (mesmas fontes e cores das artes), então o
// Creatomate só anima imagens: menos coisa pra dar errado do lado de lá.
// Trilha: SOCIAL_TRILHAS = URLs de MP3 separadas por vírgula (livres de
// direitos); alterna pelo dia do ano. Sem trilha, o vídeo sai mudo.
//
// API: POST https://api.creatomate.com/v1/renders { source, webhook_url? }
// (assíncrono: devolve uma lista de renders com status), GET /v1/renders/<id>
// até status "succeeded" (campo url = MP4) ou "failed" (error_message).
// Chave: CREATOMATE_API_KEY (Bearer).

import { REELS, CAMADAS, ZOOM_CEU, ENTRADA, SAIDA } from './reelsAnimacao.js';

export const CREATOMATE_API = 'https://api.creatomate.com/v1';
export const DURACAO_REELS = REELS.duracao;

/** Trilha do dia (rodízio pelo dia do ano), ou null. */
export function trilhaDoDia(dataISO, lista = process.env.SOCIAL_TRILHAS) {
  const trilhas = String(lista || '').split(/[,\s]+/).map((s) => s.trim()).filter((s) => /^https:\/\//.test(s));
  if (!trilhas.length) return null;
  const [y, m, d] = dataISO.split('-').map(Number);
  const diaDoAno = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000);
  return trilhas[diaDoAno % trilhas.length];
}

/**
 * RenderScript do Reels. `urls` = { ceu, r1, r2, r3 } (públicas, assinadas).
 * Linha do tempo: CAMADAS de lib/reelsAnimacao.js (a mesma do GitHub Actions).
 */
export function roteiroReels({ urls, trilha = null }) {
  const sai = { time: 'end', duration: SAIDA, easing: 'quadratic-in', type: 'fade', reversed: true };
  const sobe = { time: 'start', duration: ENTRADA, easing: 'quadratic-out', type: 'slide', direction: '90°', distance: '4%', fade: true };
  const elementos = [
    {
      type: 'image', track: 1, time: 0, duration: DURACAO_REELS, source: urls.ceu, fit: 'cover', clip: true,
      animations: [{ time: 0, duration: DURACAO_REELS, easing: 'linear', type: 'scale', scope: 'element', start_scale: '100%', end_scale: `${Math.round((1 + ZOOM_CEU) * 100)}%`, fade: false }],
    },
    ...CAMADAS.map((c) => ({
      type: 'image', track: 2, time: c.inicio, duration: Math.round((c.fim - c.inicio) * 100) / 100, source: urls[c.id], fit: 'contain',
      animations: c.sai ? [sobe, sai] : [{ time: 'start', duration: 0.6, easing: 'quadratic-out', type: 'fade' }],
    })),
  ];
  if (trilha) elementos.push({ type: 'audio', track: 3, time: 0, duration: DURACAO_REELS, source: trilha, volume: '70%', audio_fade_in: 0.5, audio_fade_out: 1.5 });
  return { output_format: 'mp4', width: REELS.largura, height: REELS.altura, frame_rate: REELS.fps, duration: DURACAO_REELS, elements: elementos };
}

async function creatomate(caminho, { method = 'GET', body } = {}) {
  const chave = process.env.CREATOMATE_API_KEY;
  if (!chave) throw new Error('CREATOMATE_API_KEY não configurada');
  let res;
  try {
    res = await fetch(`${CREATOMATE_API}${caminho}`, {
      method,
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Creatomate sem resposta (${err.cause?.code || err.message})`);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Creatomate: ${json?.hint || json?.message || `HTTP ${res.status}`}`);
  return json;
}

/** Pede o render. Devolve o id (o vídeo fica pronto em segundo plano). */
export async function iniciarRender({ source, webhookUrl = null, metadata = '' }) {
  const body = { source, metadata };
  if (webhookUrl) body.webhook_url = webhookUrl;
  const r = await creatomate('/renders', { method: 'POST', body });
  const render = Array.isArray(r) ? r[0] : r;
  if (!render?.id) throw new Error('Creatomate não devolveu o id do render');
  return render.id;
}

/** { status, url, erro } do render. */
export async function consultarRender(id) {
  const r = await creatomate(`/renders/${encodeURIComponent(id)}`);
  return { status: r.status, url: r.url || null, erro: r.error_message || null };
}
