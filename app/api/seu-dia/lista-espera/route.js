import { NextResponse } from 'next/server';
import { admin, emailDaSessao } from '@/lib/seuDiaServidor';

export const runtime = 'nodejs';

// POST { plano: 'anual'|'mensal' } → entra na lista de espera do Seu Dia
// Completo (fase 1 ainda não cobra). Guarda a data da 1ª vez e o plano mais recente.
export async function POST(request) {
  const email = emailDaSessao(request);
  if (!email) return NextResponse.json({ logado: false }, { status: 401 });
  let plano;
  try {
    plano = (await request.json())?.plano;
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  if (plano !== 'anual' && plano !== 'mensal') return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });

  try {
    const sb = admin();
    const { data: p } = await sb.from('seu_dia_perfis').select('lista_espera_em').eq('email', email).maybeSingle();
    await sb
      .from('seu_dia_perfis')
      .update({ lista_espera_plano: plano, lista_espera_em: p?.lista_espera_em ?? new Date().toISOString() })
      .eq('email', email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[seu-dia/lista-espera]', e);
    return NextResponse.json({ error: 'Não conseguimos salvar agora.' }, { status: 500 });
  }
}
