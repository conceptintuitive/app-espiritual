import { NextResponse } from 'next/server';
import { emailValido } from '@/lib/emailValidacao';
import { admin, emailDaSessao, emailDoToken } from '@/lib/seuDiaServidor';
import { criarCheckout, emailDaAnalise } from '@/lib/assinatura';
import { PLANOS, METODOS } from '@/lib/assinaturaRegras';

export const runtime = 'nodejs';

// POST { plano: 'mensal'|'anual', metodo: 'recorrente'|'prepago', email?, analiseId?, renovar? }
// → { url } do checkout do Mercado Pago.
// De quem é a assinatura (em ordem): sessão do Seu Dia → token de renovação
// do e-mail → e-mail da análise → e-mail digitado.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  const plano = body?.plano;
  const metodo = body?.metodo;
  if (!PLANOS[plano] || !METODOS.has(metodo)) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });

  try {
    const sb = admin();
    let email = emailDaSessao(request)
      || (body?.renovar ? emailDoToken(body.renovar, 'renovar') : null)
      || (body?.analiseId ? await emailDaAnalise(sb, body.analiseId) : null)
      || String(body?.email || '').trim().toLowerCase();
    email = String(email || '').trim().toLowerCase();
    if (!emailValido(email)) return NextResponse.json({ error: 'precisa_email', mensagem: 'Informe o seu e-mail.' }, { status: 400 });

    const { url } = await criarCheckout(sb, { email, plano, metodo });
    if (!url) throw new Error('MP não devolveu init_point');
    return NextResponse.json({ url });
  } catch (e) {
    console.error('[assinatura/checkout]', e?.message, e?.mp || '');
    return NextResponse.json({ error: 'Não conseguimos abrir o pagamento agora. Tente de novo em instantes.' }, { status: 500 });
  }
}
