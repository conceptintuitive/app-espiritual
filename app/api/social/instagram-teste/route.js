// Conferir o token do Instagram antes de ligar a automação, sem postar nada.
//   GET /api/social/instagram-teste?secret=CRON_SECRET   (ou Authorization: Bearer)
// Faz só GET /{INSTAGRAM_USER_ID}?fields=username no host do modo atual
// (graph.facebook.com pro token de usuário do sistema, graph.instagram.com pro
// token do login do Instagram; ver lib/instagram.js) e devolve o resultado.
// Nunca devolve o token.

import { NextResponse } from 'next/server';
import { conferirContaInstagram } from '@/lib/instagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const r = await conferirContaInstagram();
  return NextResponse.json(r, { status: r.ok ? 200 : 502, headers: { 'Cache-Control': 'no-store' } });
}
