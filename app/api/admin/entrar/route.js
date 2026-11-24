// POST /api/admin/entrar (formulário de /admin/tiktok): confere o CRON_SECRET e
// grava o cookie de sessão (lib/adminSessao.js, 12h). Sair: ?sair=1.
import { NextResponse } from 'next/server';
import { COOKIE_ADMIN, criarSessaoAdmin, segredoConfere } from '@/lib/adminSessao';

export const runtime = 'nodejs';

export async function POST(request) {
  const form = await request.formData().catch(() => null);
  const volta = new URL('/admin/tiktok', request.url);
  if (new URL(request.url).searchParams.get('sair') === '1') {
    const r = NextResponse.redirect(volta, 303);
    r.cookies.set(COOKIE_ADMIN, '', { path: '/', maxAge: 0 });
    return r;
  }
  if (!segredoConfere(String(form?.get('segredo') || ''))) {
    volta.searchParams.set('erro', '1');
    return NextResponse.redirect(volta, 303);
  }
  const { valor, maxAge } = criarSessaoAdmin();
  const r = NextResponse.redirect(volta, 303);
  r.cookies.set(COOKIE_ADMIN, valor, { path: '/', maxAge, httpOnly: true, secure: true, sameSite: 'lax' });
  return r;
}
