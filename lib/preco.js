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

export function dentroDaJanela(createdAt, referencia = Date.now()) {
  if (!createdAt) return false;
  return referencia - new Date(createdAt).getTime() <= JANELA_LANCAMENTO_MS;
}

// `referencia` é opcional — passa um timestamp específico (ex: paid_at) pra
// saber se o preço de janela valia NAQUELE momento, em vez de agora.
export function getPrecoManual(createdAt, referencia = Date.now()) {
  return dentroDaJanela(createdAt, referencia) ? PRECO_MANUAL_JANELA : PRECO_MANUAL_PADRAO;
}
