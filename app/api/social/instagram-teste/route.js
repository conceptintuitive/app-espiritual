// Conferir o token do Instagram antes de ligar a automação, sem postar nada.
//   GET /api/social/instagram-teste?secret=CRON_SECRET   (ou Authorization: Bearer)
// Faz só GET /{INSTAGRAM_USER_ID}?fields=username no host do modo atual
// (graph.facebook.com pro token de usuário do sistema, graph.instagram.com pro
// token do login do Instagram; ver lib/instagram.js) e devolve o resultado.
// Em `token`: o que o debug_token da Meta diz dele (app que gerou, tipo:
// usuário ou usuário do sistema, permissões, o que falta pra automação, se a
// conta do Instagram está coberta, quando expira). Nunca devolve o token.

import { NextResponse } from 'next/server';
import { conferirContaInstagram, inspecionarToken } from '@/lib/instagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const [r, token] = await Promise.all([conferirContaInstagram(), inspecionarToken()]);
  return NextResponse.json({ ...r, token }, { status: r.ok ? 200 : 502, headers: { 'Cache-Control': 'no-store' } });
}
