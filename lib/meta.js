// lib/meta.js
// Envia evento "Purchase" para a Meta Conversions API (server-side).
// Usado pelos webhooks de pagamento (Stripe e Mercado Pago) após confirmação.
import { createHash } from "crypto";

export const META_PIXEL_ID = "1012756614970977";

function hashEmail(email) {
  if (!email) return undefined;
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function sendMetaPurchase({ transactionId, value, currency, email, analiseId }) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("❌ META_ACCESS_TOKEN ausente");
    return;
  }

  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: transactionId,
              action_source: "website",
              event_source_url: `https://intuitiveconcept.com.br/manual/${analiseId}`,
              user_data: {
                em: [hashEmail(email)].filter(Boolean),
              },
              custom_data: {
                value,
                currency,
                content_ids: [analiseId],
                content_type: "product",
                content_name: "Manual Premium Personalizado",
              },
            },
          ],
        }),
      }
    );

    const fbBody = await fbRes.json().catch(() => ({}));

    if (!fbRes.ok) {
      console.error("❌ Falha ao enviar Purchase para Meta:", fbRes.status, fbBody);
    } else {
      console.log("✅ Purchase enviado à Meta:", transactionId);
    }
  } catch (err) {
    console.error("❌ Erro ao enviar Purchase para Meta:", err);
  }
}
