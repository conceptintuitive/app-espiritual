// GET /api/social/imagem/<YYYY-MM-DD>/<story|feed>.jpg?i=<índice da série>&t=<assinatura>
// Arte do dia em JPEG, pública pra o Instagram e o TikTok baixarem na hora de
// postar (e pra prévia). A URL é assinada com HMAC (lib/social.js,
// segredo = CRON_SECRET): sem a assinatura certa, 404 — ninguém usa o
// servidor pra gerar arte nem troca o item da série pela URL.
// Conteúdo não tem nada pessoal e é sempre o mesmo pra mesma URL: cache longo.

import { conferirAssinatura, dataValida } from '@/lib/social';
import { arteJpeg } from '../../../_arte/respostaArte';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request, { params }) {
  const { data, arquivo } = await params;
  const formato = { 'story.jpg': 'story', 'feed.jpg': 'feed' }[arquivo];
  const { searchParams } = new URL(request.url);
  const iTexto = searchParams.get('i');
  const indice = iTexto != null && /^\d{1,6}$/.test(iTexto) ? Number(iTexto) : null;
  const t = searchParams.get('t');

  if (!formato || !dataValida(data) || (iTexto != null && indice == null)
    || !conferirAssinatura({ data, formato, indice, t }, process.env.CRON_SECRET)) {
    return new Response('Não encontrado', { status: 404 });
  }

  try {
    const jpg = await arteJpeg(data, formato, indice);
    if (!jpg) return new Response('Sem post neste dia', { status: 404 });
    return new Response(jpg, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpg.length),
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      },
    });
  } catch (err) {
    console.error('❌ Erro ao gerar arte social:', err);
    return new Response('Erro ao gerar a imagem', { status: 500 });
  }
}
