import { NextResponse } from 'next/server';
import { admin, emailDaSessao } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

function validarInscricao(sub) {
  const endpoint = String(sub?.endpoint || '');
  const p256dh = String(sub?.keys?.p256dh || '');
  const auth = String(sub?.keys?.auth || '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint, p256dh, auth };
}

// POST { subscription } → liga o aviso das 7h neste aparelho.
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });
  let sub;
  try {
    sub = validarInscricao((await request.json())?.subscription);
  } catch {
    sub = null;
  }
  if (!sub) return NextResponse.json({ error: 'Inscrição inválida' }, { status: 400 });
  try {
    const { error } = await admin().from('seu_dia_push').upsert({ ...sub, email }, { onConflict: 'endpoint' });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[seu-dia/push POST]', e);
    return NextResponse.json({ error: 'Não conseguimos ativar agora.' }, { status: 500 });
  }
}

// DELETE { endpoint } → desliga o aviso neste aparelho.
export async function DELETE(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });
  try {
    const endpoint = String((await request.json())?.endpoint || '');
    await admin().from('seu_dia_push').delete().eq('endpoint', endpoint).eq('email', email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[seu-dia/push DELETE]', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
