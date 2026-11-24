// GET /api/social/imagem/<AAAA-MM-DD>/<arquivo>?i=<índice>&v=<versão>&t=<assinatura>
// Artes do dia, públicas pra o Instagram, o TikTok e o Creatomate baixarem (e
// pra prévia). arquivo: story.jpg, c1.jpg…c7.jpg (carrossel; feed.jpg = c1),
// ceu.jpg (fundo do Reels), r1.png…r3.png (textos do Reels).
// A URL é assinada com HMAC (lib/social.js, segredo = CRON_SECRET): sem a
// assinatura certa, 404. O texto vem de social_conteudos (ou da reserva, pelo
// índice da URL). `v` muda quando o texto muda, então o cache longo é seguro.

import { createClient } from '@supabase/supabase-js';
import { conferirAssinatura, dataValida, FORMATOS } from '@/lib/social';
import { conteudoParaArte } from '@/lib/socialServidor';
import { gerarArte } from '../../../_arte/respostaArte';

export const runtime = 'nodejs';
export const maxDuration = 30;

function supabaseServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function GET(request, { params }) {
  const { data, arquivo } = await params;
  const m = /^([a-z0-9]+)\.(jpg|png)$/.exec(arquivo || '');
  const formato = m && FORMATOS[m[1]] && FORMATOS[m[1]].ext === m[2] ? m[1] : null;
  const { searchParams } = new URL(request.url);
  const iTexto = searchParams.get('i');
  const indice = iTexto != null && /^\d{1,6}$/.test(iTexto) ? Number(iTexto) : null;
  const v = searchParams.get('v') || '';
  const t = searchParams.get('t');

  if (!formato || !dataValida(data) || (iTexto != null && indice == null) || !/^[0-9a-f]{0,16}$/.test(v)
    || !conferirAssinatura({ data, formato, indice, v, t }, process.env.CRON_SECRET)) {
    return new Response('Não encontrado', { status: 404 });
  }

  try {
    const { dados, conteudo } = await conteudoParaArte(supabaseServidor(), data, indice);
    const arte = await gerarArte({ data, formato, dados, conteudo });
    if (!arte) return new Response('Essa tela não existe', { status: 404 });
    return new Response(arte.buffer, {
      headers: {
        'Content-Type': arte.tipo,
        'Content-Length': String(arte.buffer.length),
        // Com versão na URL o conteúdo nunca muda; sem versão (reserva), cache curto.
        'Cache-Control': v ? 'public, max-age=86400, s-maxage=604800, immutable' : 'public, max-age=600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('❌ Erro ao gerar arte social:', err);
    return new Response('Erro ao gerar a imagem', { status: 500 });
  }
}
