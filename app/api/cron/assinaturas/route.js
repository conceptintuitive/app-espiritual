import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { admin, tokenEmail } from '@/lib/seuDiaServidor';
import { sincronizarPreapproval } from '@/lib/assinatura';
import { getBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Rotina diária da assinatura (cron externo, ex. cron-job.org 1x/dia):
//   GET /api/cron/assinaturas?secret=CRON_SECRET
// 1. Cartão: sincroniza com o MP as assinaturas que vencem em até 2 dias
//    (pega renovação que o webhook não avisou, e cancelamento feito no app do MP).
// 2. Pré-pago (Pix): lembrete por e-mail 3 dias antes de vencer, com link de renovação.
// 3. Marca como 'expirada' o que venceu.
async function handler(request) {
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!cronSecret || provided !== cronSecret) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const sb = admin();
  const agora = Date.now();
  const em = (dias) => new Date(agora + dias * 86400 * 1000).toISOString();
  const resultado = { sincronizadas: 0, lembretes: 0, expiradas: 0, erros: 0 };

  // 1. Cartão
  const { data: cartoes } = await sb.from('assinaturas')
    .select('mp_preapproval_id')
    .eq('metodo', 'recorrente').eq('status', 'ativa')
    .not('mp_preapproval_id', 'is', null)
    .lte('acesso_ate', em(2));
  for (const c of cartoes || []) {
    try {
      await sincronizarPreapproval(sb, c.mp_preapproval_id);
      resultado.sincronizadas += 1;
    } catch (e) {
      resultado.erros += 1;
      console.error('[cron/assinaturas] sync', c.mp_preapproval_id, e?.message);
    }
  }

  // 2. Lembrete do pré-pago
  const { data: avencer } = await sb.from('assinaturas')
    .select('id, email, plano, acesso_ate')
    .eq('metodo', 'prepago').eq('status', 'ativa')
    .is('lembrete_enviado_em', null)
    .gte('acesso_ate', em(0)).lte('acesso_ate', em(3.5));
  if (avencer?.length && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    for (const a of avencer) {
      // Se a pessoa já tem outra linha valendo por mais tempo, não lembra.
      const { data: outra } = await sb.from('assinaturas').select('id').eq('email', a.email).gt('acesso_ate', new Date(new Date(a.acesso_ate).getTime() + 86400 * 1000).toISOString()).limit(1);
      if (outra?.length) {
        await sb.from('assinaturas').update({ lembrete_enviado_em: new Date().toISOString() }).eq('id', a.id);
        continue;
      }
      const link = `${getBaseUrl()}/assinar?plano=${a.plano}&renovar=${encodeURIComponent(tokenEmail(a.email, 'renovar', 15 * 86400 * 1000))}`;
      const data = new Date(a.acesso_ate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const { error } = await resend.emails.send({
        from: 'Intuitive Concept <acesso@intuitiveconcept.com.br>',
        to: a.email,
        subject: `Seu Intuitive Completo vence em ${data}`,
        text: `Seu acesso ao Intuitive Completo vai até ${data}. Pra continuar com o Seu Dia completo, a Previsão do Ano, o Human Design e o Oráculo ilimitado, renove aqui:\n\n${link}`,
        html: `
          <div style="background:#0a0118;padding:32px 20px;font-family:Georgia,serif;color:#faf5ff;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:.2em;color:#f5a524">✦ INTUITIVE CONCEPT</p>
            <h1 style="margin:0 0 14px;font-size:22px">Seu Intuitive Completo vence em ${data}</h1>
            <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:#e9dcff">Renove pra continuar com o Seu Dia completo, a Previsão do Ano, o Human Design e o Oráculo ilimitado.</p>
            <a href="${link}" style="display:inline-block;background:#db2777;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:700">Renovar agora</a>
          </div>`,
      });
      if (error) { resultado.erros += 1; continue; }
      await sb.from('assinaturas').update({ lembrete_enviado_em: new Date().toISOString() }).eq('id', a.id);
      resultado.lembretes += 1;
    }
  }

  // 3. Expiradas
  const { data: exp } = await sb.from('assinaturas')
    .update({ status: 'expirada', atualizado_em: new Date().toISOString() })
    .in('status', ['ativa', 'cancelada'])
    .lt('acesso_ate', em(0))
    .select('id');
  resultado.expiradas = exp?.length || 0;

  return NextResponse.json(resultado);
}

export const GET = handler;
export const POST = handler;
