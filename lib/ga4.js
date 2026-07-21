// lib/ga4.js
// Envia evento "purchase" para o GA4 via Measurement Protocol (server-side).
// Usado pelos webhooks de pagamento (Stripe e Mercado Pago) após confirmação.
export async function sendGA4Purchase({ transactionId, value, currency, clientId }) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.error("❌ GA4_MEASUREMENT_ID ou GA4_API_SECRET ausentes");
    return;
  }

  try {
    const gaRes = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name: "purchase",
              params: {
                transaction_id: transactionId,
                value,
                currency,
              },
            },
          ],
        }),
      }
    );

    if (!gaRes.ok) {
      const txt = await gaRes.text().catch(() => "");
      console.error("❌ Falha ao enviar purchase para GA4:", gaRes.status, txt);
    } else {
      console.log("✅ Purchase enviado ao GA4:", transactionId);
    }
  } catch (err) {
    console.error("❌ Erro ao enviar purchase:", err);
  }
}
