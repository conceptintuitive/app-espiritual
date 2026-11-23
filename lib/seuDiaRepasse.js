// lib/seuDiaRepasse.js
// Repasse do e-mail da análise pro login por código do /seu-dia (botão
// "Receber meu dia todo dia às 7h" do /resultado). Mesmo padrão do
// lib/ceuDados.js: localStorage, validade de 24h, nunca query string (e-mail
// não pode parar na URL, no GA4 nem em logs). O /seu-dia consome uma vez.

export const CHAVE_EMAIL_SEU_DIA = 'ic_sd_email';
const VALIDADE_MS = 24 * 60 * 60 * 1000;

/** @param {string} email */
export function salvarEmailSeuDia(email) {
  if (!email) return;
  try {
    window.localStorage.setItem(CHAVE_EMAIL_SEU_DIA, JSON.stringify({ v: 1, email: String(email).trim(), salvoEm: Date.now() }));
  } catch {}
}

/** Lê e apaga. @returns {string} '' se não houver ou estiver vencido */
export function consumirEmailSeuDia(agora = Date.now()) {
  try {
    const raw = window.localStorage.getItem(CHAVE_EMAIL_SEU_DIA);
    if (!raw) return '';
    window.localStorage.removeItem(CHAVE_EMAIL_SEU_DIA);
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !d.email || !d.salvoEm || agora - d.salvoEm > VALIDADE_MS) return '';
    return d.email;
  } catch {
    return '';
  }
}
