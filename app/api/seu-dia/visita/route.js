import { NextResponse } from 'next/server';
import { admin, emailDaSessao } from '@/lib/seuDiaServidor';
import { hojeNoFuso } from '@/lib/seuDia';

export const runtime = 'nodejs';

// POST → marca que a pessoa abriu o Seu Dia hoje (no fuso dela). Base da
// métrica de retorno (view seu_dia_metricas). Idempotente no mesmo dia.
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });
  try {
    const sb = admin();
    const { data: p } = await sb.from('seu_dia_perfis').select('fuso_iana').eq('email', email).maybeSingle();
    const dia = hojeNoFuso(p?.fuso_iana || 'America/Sao_Paulo');
    await sb.from('seu_dia_visitas').upsert({ email, dia }, { onConflict: 'email,dia', ignoreDuplicates: true });
    await sb.from('seu_dia_perfis').update({ ultimo_acesso: new Date().toISOString() }).eq('email', email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[seu-dia/visita]', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
