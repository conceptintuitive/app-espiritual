// lib/pixManual.js — Pix do Manual na própria página do /resultado, pela API
// de pagamentos do Mercado Pago (POST /v1/payments, payment_method_id 'pix').
// O cartão continua pelo checkout de sempre (app/api/criar-checkout-mp).
//
// O pagamento usa o MESMO external_reference (o id da análise) e o MESMO
// metadata (includes_tier2/includes_hd) da preferência do checkout, então a
// liberação é a de sempre: webhook-mp e/ou /api/confirmar-pagamento-mp →
// lib/mpPagamentoManual.js (liberação, Purchase GA4/Meta/TikTok, e-mail 1x).
// Puro, menos `criarPix` (fetch injetável nos testes: tests/pixManual.test.js).

import { PRECO_BONUS_AVULSO, PRECO_BONUS_COMBO } from './preco.js';

export const BONUS_TITULOS = { projecao12m: 'Previsão do Ano', humandesign: 'Human Design' };
export const PIX_MINUTOS = 30;
const MP_PAYMENTS = 'https://api.mercadopago.com/v1/payments';

/** Bônus pedidos: `bonusProdutos` (lista) ou `incluirTier2` (os dois), como no checkout. */
export function bonusDoPedido(body) {
  if (Array.isArray(body?.bonusProdutos)) return [...new Set(body.bonusProdutos.filter((p) => BONUS_TITULOS[p]))];
  return body?.incluirTier2 ? ['projecao12m', 'humandesign'] : [];
}

/** Valor total: Manual + bônus (combo quando vêm os dois). */
export function valorDaCompra(precoManual, bonus) {
  if (!bonus.length) return precoManual;
  return precoManual + (bonus.length === 2 ? PRECO_BONUS_COMBO : PRECO_BONUS_AVULSO);
}

/** Chave de idempotência mandada pelo navegador (1 por clique; repetir o clique devolve o mesmo Pix). */
export function chaveValida(chave) {
  return typeof chave === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(chave);
}

/** "2026-11-24T20:30:00.000-03:00" (Brasília, sem horário de verão desde 2019). */
export function expiracaoPix(agora = Date.now(), minutos = PIX_MINUTOS) {
  const brt = new Date(agora + minutos * 60000 - 3 * 3600000);
  return `${brt.toISOString().slice(0, 23)}-03:00`;
}

/**
 * Corpo do POST /v1/payments.
 * @param {{ analise: { id: string, nome?: string }, email: string, precoManual: number, bonus: string[], baseUrl: string, agora?: number }} p
 */
export function corpoPagamentoPix({ analise, email, precoManual, bonus, baseUrl, agora = Date.now() }) {
  const nomeBonus = bonus.map((b) => BONUS_TITULOS[b]).join(' + ');
  const primeiro = String(analise.nome || '').trim().split(/\s+/)[0] || undefined;
  return {
    transaction_amount: valorDaCompra(precoManual, bonus),
    description: `Manual do seu Mapa${nomeBonus ? ` + ${nomeBonus}` : ''} — Intuitive Concept`,
    payment_method_id: 'pix',
    payer: { email, ...(primeiro && { first_name: primeiro }) },
    external_reference: analise.id,
    notification_url: `${baseUrl}/api/webhook-mp`,
    date_of_expiration: expiracaoPix(agora),
    metadata: {
      includes_tier2: bonus.includes('projecao12m'),
      includes_hd: bonus.includes('humandesign'),
      origem_checkout: 'pix_na_pagina',
    },
  };
}

/** O que o navegador precisa pra mostrar o Pix. */
export function respostaPix(payment) {
  const dados = payment?.point_of_interaction?.transaction_data || {};
  if (!payment?.id || !dados.qr_code) return null;
  return {
    paymentId: String(payment.id),
    status: payment.status,
    qrCode: dados.qr_code,
    qrCodeBase64: dados.qr_code_base64 || null,
    expiraEm: payment.date_of_expiration || null,
    valor: payment.transaction_amount,
  };
}

/** Cria o pagamento Pix no MP. Lança com a mensagem do MP se der erro. */
export async function criarPix({ token, corpo, chave, fetchFn = fetch }) {
  const res = await fetchFn(MP_PAYMENTS, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': chave },
    body: JSON.stringify(corpo),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Mercado Pago: ${json?.message || json?.error || `HTTP ${res.status}`}`);
  const r = respostaPix(json);
  if (!r) throw new Error('Mercado Pago não devolveu o código Pix');
  return r;
}
