// Fonte única de validação de e-mail — front (quiz) e back (gerar-analise,
// criar-checkout-mp) usam a mesma regra, pra nunca aceitar no front algo
// que o back rejeita (ou vice-versa). Mesmo padrão já usado em
// app/resultado/[id]/page.js (presenteEmail) e app/api/lead-parcial/route.js.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

// Domínios digitados errado mais comuns → sugestão de correção. Lista curta
// de propósito: só os erros de digitação mais frequentes (troca de tecla
// .con/.com, letras trocadas) — não tenta adivinhar todo domínio possível.
const DOMINIOS_TYPO = {
  'gmail.con': 'gmail.com',
  'gmial.com': 'gmail.com',
  'hotmail.con': 'hotmail.com',
  'outlook.con': 'outlook.com',
};

// Devolve o e-mail corrigido se o domínio bater com um erro comum conhecido,
// ou null se não houver sugestão (inclui e-mails já válidos).
export function sugestaoEmail(email) {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim();
  const arroba = trimmed.lastIndexOf('@');
  if (arroba === -1) return null;
  const dominio = trimmed.slice(arroba + 1).toLowerCase();
  const corrigido = DOMINIOS_TYPO[dominio];
  if (!corrigido) return null;
  return trimmed.slice(0, arroba + 1) + corrigido;
}
