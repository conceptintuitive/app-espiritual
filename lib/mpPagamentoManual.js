import { getOrigemVenda } from "@/lib/testEmails";
import { sendGA4Purchase } from "@/lib/ga4";
import { sendTikTokPurchase } from "@/lib/tiktok";
import { sendMetaPurchase } from "@/lib/meta";

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

// Libera o acesso ao Manual (crítico) — chamado de forma síncrona pelos dois
// caminhos (webhook-mp e /api/confirmar-pagamento-mp), antes de responder.
// Idempotente: regrava os mesmos campos não importa quem chega primeiro.
export async function liberarAcessoManual({ supabase, analiseId, payment, paymentId }) {
  const { critica, bookkeeping } = buildAtualizacaoPagamentoManual(payment, paymentId);

  const { error: updateError } = await supabase.from("analises").update(critica).eq("id", analiseId);
  if (updateError) return { ok: false, error: updateError };

  // Bookkeeping, best-effort: se isso falhar, o acesso já foi liberado acima.
  const { error: bookkeepingError } = await supabase.from("analises").update(bookkeeping).eq("id", analiseId);
  if (bookkeepingError) {
    console.error("⚠️ Falha ao gravar valor_pago/origem (já liberado):", bookkeepingError);
  }

  return { ok: true };
}

// Pós-liberação: Purchase server-side (GA4/Meta/TikTok) + e-mail de acesso.
// Chamado em background (after()) pelos dois caminhos.
//
// Purchase sempre dispara dos dois — usa paymentId como transactionId/
// event_id nos dois, então a deduplicação é feita do lado do Meta/GA4/
// TikTok (mesmo padrão que o Pixel client-side já usa), não precisa de
// lock aqui.
//
// E-mail de acesso só dispara uma vez: lock atômico via `processado_em`
// (coluna só gravável enquanto NULL) — quem conseguir gravar primeiro
// dispara o e-mail; o outro caminho vê 0 linhas afetadas e pula, evitando
// e-mail duplicado quando webhook e confirmação síncrona chegam juntos.
//
// Geração de conteúdo IA é DE PROPÓSITO não duplicada aqui: já tem seu
// próprio fallback garantido em app/api/gerar-manual-completo/route.js,
// chamado automaticamente por app/manual/[id]/page.js assim que hasPaid
// vira true (que os dois caminhos acima já causam, via liberarAcessoManual).
export async function dispararPosPagamentoManual({ supabase, analiseId, payment, paymentId, payerPhone }) {
  const { data: analiseData } = await supabase
    .from("analises")
    .select("email, presente_email, presente_de, checkout_ip, checkout_user_agent")
    .eq("id", analiseId)
    .single();

  await Promise.all([
    sendGA4Purchase({
      transactionId: paymentId.toString(),
      value: payment.transaction_amount ?? 0,
      currency: (payment.currency_id || "BRL").toUpperCase(),
      clientId: `server.${paymentId}`,
    }),
    sendTikTokPurchase({
      transactionId: paymentId.toString(),
      value: payment.transaction_amount ?? 0,
      currency: (payment.currency_id || "BRL").toUpperCase(),
      email: analiseData?.email,
      analiseId,
    }),
    sendMetaPurchase({
      transactionId: paymentId.toString(),
      value: payment.transaction_amount ?? 0,
      currency: (payment.currency_id || "BRL").toUpperCase(),
      email: analiseData?.email,
      phone: payerPhone,
      analiseId,
      clientIp: analiseData?.checkout_ip || null,
      userAgent: analiseData?.checkout_user_agent || null,
    }),
  ]);

  const { data: claim } = await supabase
    .from("analises")
    .update({ processado_em: new Date().toISOString() })
    .eq("id", analiseId)
    .is("processado_em", null)
    .select("id");

  if (!claim || claim.length === 0) return; // outro caminho já processou — não manda e-mail de novo

  const emailDestino = analiseData?.presente_email || analiseData?.email;
  if (!emailDestino) return;

  try {
    await fetch("https://intuitiveconcept.com.br/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailDestino,
        manualId: analiseId,
        ...(analiseData?.presente_email && { presenteDe: analiseData?.presente_de || "" }),
      }),
    });
  } catch (emailErr) {
    console.error("Erro ao enviar email (dispararPosPagamentoManual):", emailErr);
  }
}
