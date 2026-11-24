// lib/reelsVideo.js — os argumentos do ffmpeg que montam o Reels a partir dos
// quadros capturados (scripts/reels/gerar.mjs, no GitHub Actions). Puro.
//
// Saída no formato que o Instagram pede pra Reels: MP4 com o índice no começo
// (faststart), H.264 (preset veryfast) em yuv420p, 30fps, 1080x1920, áudio AAC
// 48 kHz estéreo. Sem trilha, entra um áudio mudo (o Instagram lida melhor com
// vídeo que tem faixa de áudio).

import { REELS } from './reelsAnimacao.js';

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
