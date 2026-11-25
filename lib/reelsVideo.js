// lib/reelsVideo.js — os argumentos do ffmpeg que montam o Reels a partir dos
// quadros capturados (scripts/reels/gerar.mjs, no GitHub Actions). Puro.
//
// Saída no formato que o Instagram pede pra Reels: MP4 com o índice no começo
// (faststart), H.264 (preset veryfast) em yuv420p, 30fps, 1080x1920, áudio AAC
// 48 kHz estéreo. Sem trilha, entra um áudio mudo (o Instagram lida melhor com
// vídeo que tem faixa de áudio).

import { REELS } from './reelsAnimacao.js';

/**
 * Trilhas guardadas no repositório (scripts/reels/trilhas, do Pixabay, 20s,
 * volume normalizado). Usadas quando SOCIAL_TRILHAS está vazia.
 */
export const TRILHAS_DO_REPOSITORIO = [
  '1-ambient-piano-leberch.mp3',
  '2-corporate-ambient-atlasaudio.mp3',
  '3-soft-ambient-sub_clair.mp3',
  '4-ambient-nastelbom.mp3',
];

/** Item da lista pro dia (rodízio pelo dia do ano), ou null com a lista vazia. */
export function itemDoDia(dataISO, lista) {
  if (!lista?.length) return null;
  const [y, m, d] = dataISO.split('-').map(Number);
  const diaDoAno = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000);
  return lista[diaDoAno % lista.length];
}

/**
 * @param {{ padraoQuadros: string, trilha?: string|null, saida: string, duracao?: number, fps?: number }} p
 *   padraoQuadros: ex. "/tmp/x/q%04d.jpg"; trilha: caminho local do MP3
 */
export function argumentosFfmpeg({ padraoQuadros, trilha = null, saida, duracao = REELS.duracao, fps = REELS.fps }) {
  const a = ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', padraoQuadros];
  if (trilha) a.push('-stream_loop', '-1', '-i', trilha);
  else a.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');
  a.push(
    '-map', '0:v:0', '-map', '1:a:0', '-t', String(duracao),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-r', String(fps), '-g', String(fps * 2),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
  );
  if (trilha) a.push('-af', `afade=t=in:st=0:d=0.5,afade=t=out:st=${duracao - 1.5}:d=1.5`);
  a.push('-movflags', '+faststart', '-shortest', saida);
  return a;
}

// ── Reels narrado (30–40s) ─────────────────────────────────────────────────
// Narração (MP3 do ElevenLabs) em volume cheio + a trilha por baixo a −20 dB,
// repetida até o fim, com fade de entrada (1s) e de saída (2s). Duração =
// fala + ~1s (duracaoDoVideo em lib/reelsRoteiro.js). Mesmo vídeo do card:
// H.264 veryfast, yuv420p, 30fps, AAC 48 kHz estéreo, faststart.
export const VOLUME_TRILHA_DB = -20;

/**
 * @param {{ padraoQuadros: string, narracao?: string, vozes?: Array<{ caminho: string, inicio: number }>, trilha?: string|null, saida: string, duracao: number, fps?: number }} p
 *   narracao: 1 MP3 que começa no 0 (o narrado). vozes: vários MP3, cada um
 *   no seu segundo (o interativo: a fala, o silêncio do contador, a revelação).
 */
export function argumentosFfmpegNarrado({ padraoQuadros, narracao, vozes, trilha = null, saida, duracao, fps = REELS.fps }) {
  const dur = Math.round(duracao * 1000) / 1000;
  const lista = vozes?.length ? vozes : [{ caminho: narracao, inicio: 0 }];
  const a = ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', padraoQuadros];
  for (const v of lista) a.push('-i', v.caminho);
  const iTrilha = 1 + lista.length;
  if (trilha) a.push('-stream_loop', '-1', '-i', trilha);
  const prepara = (k) => `[${k}:a]aresample=48000,aformat=channel_layouts=stereo`;
  // 1 voz no 0 = o filtro de sempre; várias = cada uma atrasada pro seu tempo e somadas sem perder volume
  const voz = lista.length === 1 && !lista[0].inicio
    ? `${prepara(1)},apad`
    : `${lista.map((v, k) => `${prepara(k + 1)},adelay=${Math.round((v.inicio || 0) * 1000)}:all=1[v${k}]`).join(';')};`
      + `${lista.map((_, k) => `[v${k}]`).join('')}amix=inputs=${lista.length}:duration=longest:dropout_transition=0:normalize=0,apad`;
  const filtro = trilha
    ? `${voz}[voz];[${iTrilha}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${VOLUME_TRILHA_DB}dB,`
      + `afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, dur - 2).toFixed(2)}:d=2[fundo];`
      + '[voz][fundo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]'
    : `${voz}[a]`;
  a.push(
    '-filter_complex', filtro,
    '-map', '0:v:0', '-map', '[a]', '-t', String(dur),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-r', String(fps), '-g', String(fps * 2),
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart', saida,
  );
  return a;
}
