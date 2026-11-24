import { NextResponse } from 'next/server';
import { admin, emailDoTokenLogin, emailDoTokenDia, tokenSessao, COOKIE_SESSAO, OPCOES_COOKIE } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

// Abas que o link pode abrir direto (o resto da query, como utm_*, segue junto).
const ABAS = new Set(['inicio', 'hoje', 'semana', 'mapa', 'conta']);

// GET /seu-dia/entrar?t=<token>[&aba=hoje] → grava o cookie de sessão e manda
// pro /seu-dia. Aceita o token do e-mail de login (30 min) e o do e-mail das
// 7h (3 dias, tokenLinkDia), que entra logado sem código. Link vencido ou
// adulterado volta pro /seu-dia com aviso. Clicar prova que o e-mail é da
// pessoa: grava verificado_em se ainda não tinha.
export async function GET(request) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t');
  const email = emailDoTokenLogin(t) || emailDoTokenDia(t);
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

  const destino = new URL('/seu-dia', request.url);
  for (const [k, v] of url.searchParams) {
    if (k === 't') continue;
    if (k === 'aba' ? ABAS.has(v) : /^utm_[a-z]+$/.test(k)) destino.searchParams.set(k, v.slice(0, 100));
  }
  const res = NextResponse.redirect(destino);
  res.cookies.set(COOKIE_SESSAO, tokenSessao(email), OPCOES_COOKIE);
  return res;
}
