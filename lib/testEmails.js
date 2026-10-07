// Lista de e-mails de compras de teste (a própria autora testando o fluxo de
// pagamento), pra não contar como venda real. Uma única variável de ambiente
// TEST_EMAILS (separados por vírgula) é a fonte única — usada pelos webhooks
// (origem da compra) e por scripts/backfill-origem-mp.mjs (backfill).
export function isTestEmail(email) {
  if (!email) return false;
  const lista = (process.env.TEST_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}

export function getOrigemVenda(email) {
  return isTestEmail(email) ? "teste" : "venda";
}
