// lib/preco.js
// Fonte única da regra de preço do Manual: R$27 nas primeiras 24h desde a
// criação da análise (created_at), R$47 depois — sem valor de R$97. Todo
// lugar que cobra ou mostra esse preço (checkout MP, checkout Stripe,
// página de resultado, e-mails de recuperação, Oráculo, card do /explorar)
// importa daqui, pra nunca ter um lugar cobrando/mostrando um valor
// diferente dos outros.

export const JANELA_LANCAMENTO_MS = 24 * 60 * 60 * 1000;
export const PRECO_MANUAL_JANELA = 27;
export const PRECO_MANUAL_PADRAO = 47;

// Previsão de 12 Meses e Mapa de Human Design: NÃO são mais vendidos desde
// nov/2026 (vêm com o Intuitive Completo, lib/planos.js). Os valores ficam só
// pras rotas antigas (criar-checkout-upsell-mp, combo do criar-checkout-mp e
// pix-manual), que o front não chama mais.
export const PRECO_BONUS_AVULSO = 17;
export const PRECO_BONUS_COMBO = 27;

// Assinatura "Intuitive Completo" (Seu Dia completo, Previsão do Ano, Human
// Design, Compatibilidade Completa, Oráculo ilimitado; o anual inclui o Manual).
// O que cada plano inclui, pra página e textos: lib/planos.js.
// Fonte única — checkout (/api/assinatura/checkout), /assinar e Seu Dia.
export const PRECO_ASSINATURA_MENSAL = 19.9;
export const PRECO_ASSINATURA_ANUAL = 149;

export function dentroDaJanela(createdAt, referencia = Date.now()) {
  if (!createdAt) return false;
  return referencia - new Date(createdAt).getTime() <= JANELA_LANCAMENTO_MS;
}

// `referencia` é opcional — passa um timestamp específico (ex: paid_at) pra
// saber se o preço de janela valia NAQUELE momento, em vez de agora.
export function getPrecoManual(createdAt, referencia = Date.now()) {
  return dentroDaJanela(createdAt, referencia) ? PRECO_MANUAL_JANELA : PRECO_MANUAL_PADRAO;
}
