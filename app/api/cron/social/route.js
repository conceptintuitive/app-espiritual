// Post automático do dia no Instagram e no TikTok.
//   GET /api/cron/social?secret=CRON_SECRET   (ou Authorization: Bearer CRON_SECRET)
// Chamado pelo cron-job.org às 7h de Brasília. Faz:
//   - story "Energia de hoje" no Instagram (todo dia);
//   - post do feed do tema do dia (lib/social.js) no Instagram e, como foto,
//     nos rascunhos do TikTok (quinta não tem: post à mão).
// Idempotente: no máximo 1 story e 1 post por rede por dia (trava em
// social_posts, migração 0024), mesmo se o cron rodar 2 vezes; erro é tentado
// de novo no próximo disparo do dia (até 3x) e vai por e-mail.
// Liga/desliga: SOCIAL_AUTOMACAO = off | on | instagram | tiktok
// (ver lib/social.js → redesLigadas). Nada de query string pra escolher a data:
// sempre o dia de hoje em Brasília.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hojeBrasilia, redesLigadas } from '@/lib/social';
import { postarDia } from '@/lib/socialServidor';
import { getBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function rodar(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const redes = redesLigadas(process.env.SOCIAL_AUTOMACAO);
  if (!redes.length) return NextResponse.json({ ok: true, desligada: true, dica: 'SOCIAL_AUTOMACAO=on liga (ou instagram / tiktok)' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const data = hojeBrasilia();
  const r = await postarDia({ supabase, data, redes, baseUrl: getBaseUrl(), segredo: cronSecret });
  return NextResponse.json({ ok: r.erros.length === 0, data, redes, ...r }, { status: r.erros.length ? 207 : 200 });
}

export const GET = rodar;
export const POST = rodar;
