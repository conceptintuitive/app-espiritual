import { NextResponse } from 'next/server';
import { admin, emailDoTokenLogin, tokenSessao, COOKIE_SESSAO, OPCOES_COOKIE } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

// GET /seu-dia/entrar?t=<token do e-mail> → grava o cookie de sessão e manda
// pro /seu-dia. Link vencido ou adulterado volta pro /seu-dia com aviso.
export async function GET(request) {
  const t = new URL(request.url).searchParams.get('t');
  const email = emailDoTokenLogin(t);
  if (!email) return NextResponse.redirect(new URL('/seu-dia?erro=link', request.url));

  try {
    await admin()
      .from('seu_dia_perfis')
      .update({ verificado_em: new Date().toISOString() })
      .eq('email', email)
      .is('verificado_em', null);
  } catch (e) {
    console.error('[seu-dia/entrar GET]', e);
  }

  const res = NextResponse.redirect(new URL('/seu-dia', request.url));
  res.cookies.set(COOKIE_SESSAO, tokenSessao(email), OPCOES_COOKIE);
  return res;
}
