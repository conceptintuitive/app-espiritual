// POST /api/social/reels/publicar   { data, caminho, narrado? }   (Authorization: Bearer CRON_SECRET)
// narrado: true = o vídeo é o narrado; a legenda vem do roteiro (social_reels_narrados).
// O workflow do GitHub subiu o MP4 no bucket: cria o Reels no Instagram com a
// URL pública do vídeo (share_to_feed). Responde assim que o Instagram aceita
// o vídeo; a publicação, que sai quando o Instagram termina de processar, é
// feita em segundo plano (after) e, se demorar, pelo cron da hora.
import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dataValida } from '@/lib/social';
import { publicarReelsDoArquivo, avancarReels } from '@/lib/socialServidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  const segredo = process.env.CRON_SECRET;
  const enviado = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!segredo || enviado !== segredo) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!dataValida(body.data)) return NextResponse.json({ error: 'data inválida' }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const r = await publicarReelsDoArquivo({ supabase, data: body.data, caminho: body.caminho, narrado: body.narrado === true });
    if (r.ok) after(() => avancarReels({ supabase, esperarMs: 240000 }).catch((e) => console.error('❌ reels/avançar:', e.message)));
    return NextResponse.json(r);
  } catch (err) {
    console.error('❌ reels/publicar:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
