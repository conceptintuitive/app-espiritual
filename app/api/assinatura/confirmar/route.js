import { NextResponse } from 'next/server';
import { admin } from '@/lib/seuDiaServidor';
import { processarPagamento, sincronizarPreapproval, acessoPorEmail } from '@/lib/assinatura';
import { refAssinatura } from '@/lib/assinaturaRegras';

export const runtime = 'nodejs';

// POST { r: id da linha, paymentId?, preapprovalId? } — chamado pelo
// /assinar/obrigado na volta do Mercado Pago, pra liberar na hora sem
// esperar o webhook. Só aceita pagamento/preapproval cujo external_reference
// é exatamente o desta linha (ninguém libera com o pagamento de outra pessoa).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  const r = String(body?.r || '');
  if (!/^[0-9a-f-]{36}$/i.test(r)) return NextResponse.json({ error: 'Referência inválida' }, { status: 400 });

  try {
    const sb = admin();
    const { data: linha } = await sb.from('assinaturas').select('id, email, mp_preapproval_id').eq('id', r).maybeSingle();
    if (!linha) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

    const mpGet = (path) => fetch(`https://api.mercadopago.com${path}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    }).then((x) => (x.ok ? x.json() : null));

    if (body.paymentId && /^\d{1,20}$/.test(String(body.paymentId))) {
      const payment = await mpGet(`/v1/payments/${body.paymentId}`);
      if (payment?.external_reference === refAssinatura(r)) await processarPagamento(sb, payment);
    }
    const preId = body.preapprovalId || linha.mp_preapproval_id;
    if (preId && /^[\w-]{6,64}$/.test(String(preId))) {
      const pre = await mpGet(`/preapproval/${preId}`);
      if (pre?.external_reference === refAssinatura(r)) await sincronizarPreapproval(sb, preId);
    }

    const acesso = await acessoPorEmail(sb, linha.email);
    return NextResponse.json({ ...acesso });
  } catch (e) {
    console.error('[assinatura/confirmar]', e?.message);
    return NextResponse.json({ ativa: false, erro: true }, { status: 500 });
  }
}
