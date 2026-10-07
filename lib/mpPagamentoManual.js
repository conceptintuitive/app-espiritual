import { getOrigemVenda } from "@/lib/testEmails";

// Monta o update de liberação do Manual (e do combo tier2/hd, se o
// checkout incluía) a partir de um pagamento já confirmado 'approved' na
// API do MP. Usado tanto pelo webhook quanto pela confirmação síncrona em
// /api/confirmar-pagamento-mp — mesma regra nos dois lugares, de propósito,
// pra não divergir sobre o que conta como "liberado".
//
// Separado em "critica" (payment_status etc — o que de fato libera o
// conteúdo) e "bookkeeping" (valor_pago/origem) porque quem chama grava os
// dois em updates separados: se o bookkeeping falhar, o acesso já foi
// liberado antes e não pode voltar erro por causa disso.
export function buildAtualizacaoPagamentoManual(payment, paymentId) {
  const includesTier2 = payment.metadata?.includes_tier2 === true || payment.metadata?.includes_tier2 === "true";
  const includesHd = payment.metadata?.includes_hd === true || payment.metadata?.includes_hd === "true";

  return {
    critica: {
      payment_status: "paid",
      mp_payment_id: paymentId.toString(),
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(includesTier2 && {
        tier2_payment_status: "paid",
        tier2_mp_payment_id: paymentId.toString(),
        tier2_paid_at: new Date().toISOString(),
      }),
      ...(includesHd && {
        hd_payment_status: "paid",
        hd_mp_payment_id: paymentId.toString(),
        hd_paid_at: new Date().toISOString(),
      }),
    },
    bookkeeping: {
      valor_pago: payment.transaction_amount ?? 0,
      origem: getOrigemVenda(payment.payer?.email),
    },
  };
}
