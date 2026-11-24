// lib/socialReels.js — Reels diário via Creatomate. SÓ SERVIDOR.
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

export const CREATOMATE_API = 'https://api.creatomate.com/v1';
export const DURACAO_REELS = 9;

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
 * Linha do tempo (9s): gancho 0,4–4,4s · virada 4,6–7,2s · chamada 7,3–9s.
 */
export function roteiroReels({ urls, trilha = null }) {
  const entra = (d = 0.7) => ({ time: 'start', duration: d, easing: 'quadratic-out', type: 'fade' });
  const sai = (d = 0.4) => ({ time: 'end', duration: d, easing: 'quadratic-in', type: 'fade', reversed: true });
  const sobe = { time: 'start', duration: 0.8, easing: 'quadratic-out', type: 'slide', direction: '90°', distance: '4%', fade: true };
  const elementos = [
    {
      type: 'image', track: 1, time: 0, duration: DURACAO_REELS, source: urls.ceu, fit: 'cover', clip: true,
      animations: [{ time: 0, duration: DURACAO_REELS, easing: 'linear', type: 'scale', scope: 'element', start_scale: '100%', end_scale: '112%', fade: false }],
    },
    { type: 'image', track: 2, time: 0.4, duration: 4.0, source: urls.r1, fit: 'contain', animations: [sobe, sai()] },
    { type: 'image', track: 2, time: 4.6, duration: 2.6, source: urls.r2, fit: 'contain', animations: [sobe, sai()] },
    { type: 'image', track: 2, time: 7.3, duration: DURACAO_REELS - 7.3, source: urls.r3, fit: 'contain', animations: [entra(0.6)] },
  ];
  if (trilha) elementos.push({ type: 'audio', track: 3, time: 0, duration: DURACAO_REELS, source: trilha, volume: '70%', audio_fade_in: 0.5, audio_fade_out: 1.5 });
  return { output_format: 'mp4', width: 1080, height: 1920, frame_rate: 30, duration: DURACAO_REELS, elements: elementos };
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
