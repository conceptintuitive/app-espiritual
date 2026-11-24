import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrecoManual } from '@/lib/preco';
import { emailValido } from '@/lib/emailValidacao';
import { salvarAtribuicao } from '@/lib/ga4';
import { getBaseUrl } from '@/lib/baseUrl';
import { bonusDoPedido, chaveValida, corpoPagamentoPix, criarPix } from '@/lib/pixManual';

export const runtime = 'nodejs';

// POST /api/pix-manual — Pix do Manual na própria página do /resultado
// (lib/pixManual.js). Mesmo pedido e mesmas validações do checkout de cartão
// (app/api/criar-checkout-mp): preço de lib/preco.js, combo, presente, e-mail
// inválido devolve { error: 'email_invalido' } pro modal de correção, e a
// atribuição do Google Ads. A liberação é a de sempre (webhook-mp +
// /api/confirmar-pagamento-mp → lib/mpPagamentoManual.js).
// Body: { analiseId, chave, incluirTier2?, presenteEmail?, presenteDe?, emailCorrigido?, atribuicao? }
export async function POST(request) {
  const mpToken = process.env.MP_ACCESS_TOKEN;
  if (!mpToken) return NextResponse.json({ error: 'Missing MP_ACCESS_TOKEN' }, { status: 500 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const body = await request.json().catch(() => null);
  const analiseId = body?.analiseId;
  if (!analiseId) return NextResponse.json({ error: 'ID da análise é obrigatório' }, { status: 400 });
  if (!chaveValida(body?.chave)) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });

  const presenteEmail = String(body?.presenteEmail || '').trim();
  const presenteDe = String(body?.presenteDe || '').trim();
  if (presenteEmail && !emailValido(presenteEmail)) return NextResponse.json({ error: 'Email de presente inválido' }, { status: 400 });
  const emailCorrigido = String(body?.emailCorrigido || '').trim();
  if (emailCorrigido && !emailValido(emailCorrigido)) {
    return NextResponse.json({ error: 'email_invalido', mensagem: 'Esse e-mail também não parece válido. Confira e tente de novo.' }, { status: 400 });
  }

  try {
    const { data: analise, error } = await supabase.from('analises').select('id, nome, email, payment_status, created_at').eq('id', analiseId).single();
    if (error || !analise) return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 });
    if (analise.payment_status === 'paid') return NextResponse.json({ error: 'Esta análise já foi paga' }, { status: 400 });

    let email = analise.email;
    if (emailCorrigido) {
      email = emailCorrigido;
      const { error: e } = await supabase.from('analises').update({ email: emailCorrigido, updated_at: new Date().toISOString() }).eq('id', analiseId);
      if (e) return NextResponse.json({ error: 'Erro ao atualizar e-mail' }, { status: 500 });
    } else if (!emailValido(email)) {
      return NextResponse.json({
        error: 'email_invalido',
        mensagem: `O e-mail salvo (${email || 'em branco'}) parece inválido. Confirme ou corrija abaixo pra continuar.`,
        emailAtual: email || '',
      }, { status: 400 });
    }

    const corpo = corpoPagamentoPix({
      analise, email, precoManual: getPrecoManual(analise.created_at), bonus: bonusDoPedido(body), baseUrl: getBaseUrl(),
    });
    const pix = await criarPix({ token: mpToken, corpo, chave: body.chave });

    // Igual ao checkout de cartão: presente pronto pro e-mail de acesso, e
    // IP/navegador pro Purchase da Meta (best effort, colunas antigas).
    if (presenteEmail) {
      await supabase.from('analises').update({ presente_email: presenteEmail, presente_de: presenteDe || null, updated_at: new Date().toISOString() }).eq('id', analiseId);
    }
    const { error: trackingErr } = await supabase.from('analises').update({
      checkout_ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      checkout_user_agent: request.headers.get('user-agent') || null,
    }).eq('id', analiseId);
    if (trackingErr) console.error('⚠️ pix-manual: checkout_ip/user_agent', trackingErr.message);
    if (body?.atribuicao) await salvarAtribuicao(supabase, analiseId, body.atribuicao);

    return NextResponse.json(pix);
  } catch (e) {
    console.error('❌ pix-manual:', e?.message || e);
    return NextResponse.json({ error: 'Não conseguimos gerar o Pix agora', details: String(e?.message || e).slice(0, 200) }, { status: 502 });
  }
}
