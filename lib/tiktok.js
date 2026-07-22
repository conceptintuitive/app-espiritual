// lib/tiktok.js
// Envia evento "CompletePayment" para a TikTok Events API (server-side).
// Usado pelos webhooks de pagamento (Stripe e Mercado Pago) após confirmação.
import { createHash } from "crypto";

export const TIKTOK_PIXEL_ID = "D9FVH0JC77U5KEVKR0NG";

function hashEmail(email) {
  if (!email) return undefined;
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function sendTikTokPurchase({ transactionId, value, currency, email, analiseId }) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("❌ TIKTOK_ACCESS_TOKEN ausente");
    return;
  }

  try {
    const ttRes = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify({
          event_source: "web",
          event_source_id: TIKTOK_PIXEL_ID,
          data: [
            {
              event: "CompletePayment",
              event_id: transactionId,
              event_time: Math.floor(Date.now() / 1000),
              user: {
                email: hashEmail(email),
              },
              properties: {
                value,
                currency,
                contents: [
                  {
                    content_id: analiseId,
                    content_type: "product",
                    content_name: "Manual Personalizado",
                  },
                ],
              },
            },
          ],
        }),
      }
    );

    const ttBody = await ttRes.json().catch(() => ({}));

    if (!ttRes.ok || ttBody.code !== 0) {
      console.error("❌ Falha ao enviar CompletePayment para TikTok:", ttRes.status, ttBody);
    } else {
      console.log("✅ CompletePayment enviado ao TikTok:", transactionId);
    }
  } catch (err) {
    console.error("❌ Erro ao enviar CompletePayment para TikTok:", err);
  }
}
