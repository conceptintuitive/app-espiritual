// GET /api/social/reels/trabalho[?data=AAAA-MM-DD][&card=1][&previa=1]   (Authorization: Bearer CRON_SECRET)
// card=1: força o card de 9s (o workflow pede quando o vídeo narrado falha).
// previa=1: Reels narrado de prévia (workflow com previa=sim), nunca publicado.
// Com SOCIAL_REELS_NARRADO=on, gera o roteiro e a narração aqui se faltarem
// (IA + ElevenLabs, por isso maxDuration 300).
// Chamado pelo workflow do GitHub (scripts/reels/gerar.mjs): devolve a página
// da animação do Reels (assinada), a trilha do dia e uma URL de upload
// assinada do Supabase Storage — ou { pular } quando não há nada a fazer
// (já publicado, motor não é o GitHub, automação desligada). Sem `data`, hoje
// em Brasília.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hojeBrasilia, dataValida } from '@/lib/social';
import { trabalhoDoReels } from '@/lib/socialServidor';
import { getBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request) {
  const segredo = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const enviado = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || searchParams.get('secret');
  if (!segredo || enviado !== segredo) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  const data = dataValida(searchParams.get('data')) ? searchParams.get('data') : hojeBrasilia();
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const card = searchParams.get('card') === '1';
    const previa = searchParams.get('previa') === '1';
    return NextResponse.json(await trabalhoDoReels({ supabase, data, baseUrl: getBaseUrl(), segredo, card, previa }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('❌ reels/trabalho:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
