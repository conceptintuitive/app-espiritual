// lib/ga4.js
// Envia evento "purchase" para o GA4 via Measurement Protocol (server-side).
// Usado pelos webhooks de pagamento (Stripe e Mercado Pago) após confirmação.
//
// Atribuição (nov/2026): com a atribuição salva na análise (coluna
// `atribuicao`, migração 0023, gravada no quiz e em cada checkout a partir do
// navegador — ver lib/atribuicao.js), o purchase sai com o client_id real do
// cookie _ga + o session_id da sessão do checkout, e o GA4 junta a compra à
// sessão que veio do anúncio (é o que o Google Ads importa). Sem atribuição
// (análise antiga, sem consentimento ou migração não rodada), cai no
// client_id do servidor como antes.

import { normalizarAtribuicao, payloadPurchaseGA4 } from "./atribuicao.js";

/**
 * @param {{ transactionId: string, value: number, currency: string, clientId: string,
 *   atribuicao?: object|null, item?: string }} p  clientId = reserva ("server.<id>")
 */
export async function sendGA4Purchase({ transactionId, value, currency, clientId, atribuicao = null, item = null }) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.error("❌ GA4_MEASUREMENT_ID ou GA4_API_SECRET ausentes");
    return;
  }

  const corpo = payloadPurchaseGA4({ transactionId, value, currency, atribuicao, clientIdReserva: clientId, item });

  try {
    const gaRes = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      }
    );

    if (!gaRes.ok) {
      const txt = await gaRes.text().catch(() => "");
      console.error("❌ Falha ao enviar purchase para GA4:", gaRes.status, txt);
    } else {
      console.log(
        "✅ Purchase enviado ao GA4:", transactionId,
        corpo.client_id === clientId ? "(sem client_id do navegador)" : "(client_id + session_id do navegador)"
      );
    }
  } catch (err) {
    console.error("❌ Erro ao enviar purchase:", err);
  }
}

/**
 * Lê a atribuição salva na análise. Consulta separada e best effort: se a
 * migração 0023 não rodou, devolve null e o resto do webhook segue igual.
 */
export async function buscarAtribuicao(supabase, analiseId) {
  if (!supabase || !analiseId) return null;
  try {
    const { data, error } = await supabase.from("analises").select("atribuicao").eq("id", analiseId).single();
    if (error) return null;
    return data?.atribuicao || null;
  } catch {
    return null;
  }
}

/**
 * Grava a atribuição vinda do navegador (body.atribuicao) na análise.
 * Best effort, num update separado: nunca derruba o quiz nem o checkout.
 */
export async function salvarAtribuicao(supabase, analiseId, bruto) {
  const atribuicao = normalizarAtribuicao(bruto);
  if (!supabase || !analiseId || !atribuicao) return;
  try {
    const { error } = await supabase.from("analises").update({ atribuicao }).eq("id", analiseId);
    if (error) console.error("⚠️ Não foi possível salvar a atribuição (migração 0023 rodou?):", error.message);
  } catch (e) {
    console.error("⚠️ Erro ao salvar a atribuição:", e?.message);
  }
}
