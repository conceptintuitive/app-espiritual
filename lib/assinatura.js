// lib/assinatura.js — SÓ SERVIDOR. Assinatura "Intuitive Completo".
//
// Fluxos:
//  • recorrente (cartão): POST /preapproval no MP (sem plano, status pending) →
//    a pessoa autoriza no init_point → o MP cobra todo período. O acesso sai
//    do próprio preapproval (status + next_payment_date), sincronizado pelo
//    webhook (tópicos subscription_preapproval / subscription_authorized_payment
//    / payment), pela volta do checkout (/assinar/obrigado) e pelo cron diário.
//  • prepago (Pix ou cartão à vista): preferência normal do Checkout Pro por
//    1 mês ou 1 ano. Pagamento aprovado estende acesso_ate; antes de vencer, o
//    cron manda e-mail com link de renovação.
// external_reference = "assin__<id da linha em assinaturas>" nos dois casos.
// Acesso é por e-mail (ver resumoAcesso em lib/assinaturaRegras.js).

import { getBaseUrl } from '@/lib/baseUrl';
import { getOrigemVenda } from '@/lib/testEmails';
import { emailExato } from '@/lib/seuDiaServidor';
import {
  PLANOS, refAssinatura, idDaRef, estenderAcesso, acessoDoCartao, statusDoCartao, resumoAcesso, DIAS_CORTESIA_MANUAL,
} from '@/lib/assinaturaRegras';

const MP = 'https://api.mercadopago.com';

async function mp(path, { method = 'GET', body } = {}) {
  const r = await fetch(`${MP}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error(`MP ${method} ${path} → ${r.status}: ${json?.message || ''}`);
    e.status = r.status;
    e.mp = json;
    throw e;
  }
  return json;
}

// ── Acesso ───────────────────────────────────────────────────────────────────

/** Resumo de acesso de um e-mail (assinatura ativa ou 1º mês por conta do Manual). */
export async function acessoPorEmail(sb, email) {
  if (!email) return resumoAcesso({});
  const padrao = emailExato(email.toLowerCase());
  const [{ data: linhas }, { data: manual }] = await Promise.all([
    sb.from('assinaturas').select('plano, metodo, status, acesso_ate').ilike('email', padrao),
    sb.from('analises').select('paid_at').ilike('email', padrao).eq('payment_status', 'paid')
      .or('origem.is.null,origem.neq.assinatura').not('paid_at', 'is', null)
      .gte('paid_at', new Date(Date.now() - DIAS_CORTESIA_MANUAL * 86400 * 1000).toISOString())
      .order('paid_at', { ascending: false }).limit(1),
  ]);
  return resumoAcesso({ linhas: linhas || [], manualPagoEm: manual?.[0]?.paid_at || null });
}

export async function emailDaAnalise(sb, analiseId) {
  if (typeof analiseId !== 'string' || !/^[0-9a-f-]{36}$/i.test(analiseId)) return null;
  const { data } = await sb.from('analises').select('email').eq('id', analiseId).maybeSingle();
  return data?.email ? String(data.email).trim().toLowerCase() : null;
}

// ── Checkout ─────────────────────────────────────────────────────────────────

/** Cria a linha pendente + o checkout no MP. Devolve { url, id }. */
export async function criarCheckout(sb, { email, plano, metodo }) {
  const p = PLANOS[plano];
  const { data: linha, error } = await sb
    .from('assinaturas')
    .insert({ email, plano, metodo, status: 'pendente', valor: p.preco })
    .select('id')
    .single();
  if (error) throw error;

  const base = getBaseUrl();
  const volta = `${base}/assinar/obrigado?r=${linha.id}`;

  if (metodo === 'recorrente') {
    const pre = await mp('/preapproval', {
      method: 'POST',
      body: {
        reason: p.titulo,
        external_reference: refAssinatura(linha.id),
        payer_email: email,
        back_url: volta,
        status: 'pending',
        auto_recurring: { ...p.recorrencia, transaction_amount: p.preco, currency_id: 'BRL' },
      },
    });
    await sb.from('assinaturas').update({ mp_preapproval_id: pre.id, atualizado_em: new Date().toISOString() }).eq('id', linha.id);
    return { id: linha.id, url: pre.init_point };
  }

  const pref = await mp('/checkout/preferences', {
    method: 'POST',
    body: {
      items: [{
        id: `assinatura-${plano}`,
        title: plano === 'anual' ? 'Intuitive Completo — 1 ano (inclui o Manual)' : 'Intuitive Completo — 1 mês',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: p.preco,
      }],
      payer: { email },
      back_urls: { success: volta, pending: volta, failure: `${base}/assinar?erro=pagamento` },
      auto_return: 'approved',
      notification_url: `${base}/api/webhook-mp`,
      external_reference: refAssinatura(linha.id),
      payment_methods: { installments: 1 },
    },
  });
  return { id: linha.id, url: pref.init_point };
}

// ── Processamento (webhook, volta do checkout, cron) ─────────────────────────

async function linhaPorId(sb, id) {
  const { data } = await sb.from('assinaturas').select('*').eq('id', id).maybeSingle();
  return data;
}

/**
 * Pagamento aprovado com external_reference assin__… Pré-pago: estende o
 * período (idempotente por mp_payment_id). Recorrente: sincroniza o preapproval.
 */
export async function processarPagamento(sb, payment) {
  const id = idDaRef(payment?.external_reference);
  if (!id || payment.status !== 'approved') return { ok: false, motivo: 'ignorado' };
  const linha = await linhaPorId(sb, id);
  if (!linha) return { ok: false, motivo: 'sem_linha' };

  if (linha.metodo === 'recorrente') {
    const preId = payment.metadata?.preapproval_id || linha.mp_preapproval_id;
    if (preId) await sincronizarPreapproval(sb, preId);
    await sb.from('assinatura_pagamentos').upsert(
      { mp_payment_id: String(payment.id), assinatura_id: linha.id, valor: payment.transaction_amount ?? null },
      { onConflict: 'mp_payment_id', ignoreDuplicates: true },
    );
    return { ok: true };
  }

  // Pré-pago: grava o pagamento primeiro; se já existia, não estende de novo.
  const { data: novo, error } = await sb
    .from('assinatura_pagamentos')
    .upsert({ mp_payment_id: String(payment.id), assinatura_id: linha.id, valor: payment.transaction_amount ?? null }, { onConflict: 'mp_payment_id', ignoreDuplicates: true })
    .select('mp_payment_id');
  if (error) throw error;
  if (!novo?.length) return { ok: true, jaProcessado: true };

  // Renovação: estende a partir do maior vencimento entre as linhas do e-mail.
  const { data: linhasEmail } = await sb.from('assinaturas').select('acesso_ate').ilike('email', emailExato(linha.email));
  const maiorAtual = (linhasEmail || []).map((l) => l.acesso_ate).filter(Boolean).sort().pop() || null;
  const acessoAte = estenderAcesso(maiorAtual, PLANOS[linha.plano].dias);
  await sb.from('assinaturas').update({
    status: 'ativa',
    acesso_ate: acessoAte.toISOString(),
    ultimo_mp_payment_id: String(payment.id),
    valor: payment.transaction_amount ?? linha.valor,
    origem: getOrigemVenda(payment.payer?.email || linha.email),
    lembrete_enviado_em: null,
    atualizado_em: new Date().toISOString(),
  }).eq('id', linha.id);

  if (linha.plano === 'anual') await liberarManualDoAnual(sb, linha.email);
  return { ok: true };
}

/** Lê o preapproval no MP e atualiza a linha (acesso, status). */
export async function sincronizarPreapproval(sb, preapprovalId) {
  const pre = await mp(`/preapproval/${encodeURIComponent(preapprovalId)}`);
  const id = idDaRef(pre.external_reference);
  const linha = id ? await linhaPorId(sb, id) : null;
  if (!linha) return { ok: false, motivo: 'sem_linha' };

  const acessoAte = acessoDoCartao({
    status: pre.status,
    nextPaymentDate: pre.next_payment_date,
    plano: linha.plano,
    acessoAteAtual: linha.acesso_ate,
  });
  const status = statusDoCartao(pre.status);
  await sb.from('assinaturas').update({
    status: status === 'pendente' && linha.status !== 'pendente' ? linha.status : status,
    acesso_ate: acessoAte ? acessoAte.toISOString() : null,
    mp_preapproval_id: pre.id,
    origem: linha.origem || getOrigemVenda(pre.payer_email || linha.email),
    atualizado_em: new Date().toISOString(),
  }).eq('id', linha.id);

  if (pre.status === 'authorized' && linha.plano === 'anual') await liberarManualDoAnual(sb, linha.email);
  return { ok: true, status };
}

/** Notificação "subscription_authorized_payment": acha o preapproval e sincroniza. */
export async function sincronizarPagamentoAutorizado(sb, authorizedPaymentId) {
  const ap = await mp(`/authorized_payments/${encodeURIComponent(authorizedPaymentId)}`);
  if (ap?.preapproval_id) return sincronizarPreapproval(sb, ap.preapproval_id);
  return { ok: false, motivo: 'sem_preapproval' };
}

/** Cancela a renovação automática (o acesso já pago continua até acesso_ate). */
export async function cancelarRecorrentes(sb, email) {
  const { data: linhas } = await sb
    .from('assinaturas')
    .select('id, mp_preapproval_id')
    .ilike('email', emailExato(email))
    .eq('metodo', 'recorrente')
    .in('status', ['ativa', 'pendente'])
    .not('mp_preapproval_id', 'is', null);
  for (const l of linhas || []) {
    await mp(`/preapproval/${encodeURIComponent(l.mp_preapproval_id)}`, { method: 'PUT', body: { status: 'cancelled' } });
    await sb.from('assinaturas').update({ status: 'cancelada', atualizado_em: new Date().toISOString() }).eq('id', l.id);
  }
  return (linhas || []).length;
}

// ── Manual incluso no anual ──────────────────────────────────────────────────

/**
 * Libera o Manual da análise mais recente do e-mail (ou de uma análise
 * específica) pra quem tem o anual. Marca como pago com origem 'assinatura'
 * e paid_at (convenção do projeto) e manda o e-mail de acesso uma vez só
 * (mesmo lock em processado_em do lib/mpPagamentoManual.js).
 */
export async function liberarManualDoAnual(sb, email, analiseId = null) {
  let q = sb.from('analises').select('id, payment_status').ilike('email', emailExato(email));
  q = analiseId ? q.eq('id', analiseId) : q.order('created_at', { ascending: false }).limit(1);
  const { data } = await q;
  const analise = data?.[0];
  if (!analise || analise.payment_status === 'paid') return { liberado: false };

  const agora = new Date().toISOString();
  const { error } = await sb.from('analises')
    .update({ payment_status: 'paid', paid_at: agora, updated_at: agora })
    .eq('id', analise.id);
  if (error) return { liberado: false, error };
  await sb.from('analises').update({ origem: 'assinatura', valor_pago: 0 }).eq('id', analise.id);

  try {
    const { data: lock } = await sb.from('analises')
      .update({ processado_em: agora })
      .eq('id', analise.id)
      .is('processado_em', null)
      .select('id');
    if (lock?.length) {
      await fetch(`${getBaseUrl()}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, manualId: analise.id }),
      });
    }
  } catch (e) {
    console.error('[assinatura] e-mail do Manual (anual):', e?.message);
  }
  return { liberado: true, analiseId: analise.id };
}

export { PLANOS };
