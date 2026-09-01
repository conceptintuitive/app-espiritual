// lib/meta.js
// Envia eventos "Lead" e "Purchase" para a Meta Conversions API (server-side).
// Lead é usado por app/api/gerar-analise/route.js (formulário grátis); Purchase
// pelos webhooks de pagamento (Stripe e Mercado Pago) após confirmação.
import { createHash } from "crypto";

export const META_PIXEL_ID = "1012756614970977";

function hashEmail(email) {
  if (!email) return undefined;
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// Meta exige o telefone normalizado antes do hash: só dígitos, com código do
// país, sem zero à esquerda. Assume Brasil (55) quando o número não vem com
// código de país já incluído.
function hashPhone(phone) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return undefined;
  const comCodigoPais = digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
  return createHash("sha256").update(comCodigoPais).digest("hex");
}

export async function sendMetaLead({ email, phone, analiseId, clientIp, userAgent }) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("❌ META_ACCESS_TOKEN ausente");
    return;
  }

  try {
    const userData = {
      em: [hashEmail(email)].filter(Boolean),
      ph: [hashPhone(phone)].filter(Boolean),
      ...(clientIp && { client_ip_address: clientIp }),
      ...(userAgent && { client_user_agent: userAgent }),
    };

    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: "Lead",
              event_time: Math.floor(Date.now() / 1000),
              event_id: `lead-${analiseId}`,
              action_source: "website",
              event_source_url: `https://intuitiveconcept.com.br/resultado/${analiseId}`,
              user_data: userData,
            },
          ],
        }),
      }
    );

    const fbBody = await fbRes.json().catch(() => ({}));

    if (!fbRes.ok) {
      console.error("❌ Falha ao enviar Lead para Meta:", fbRes.status, JSON.stringify(fbBody));
    } else {
      console.log("✅ Lead enviado à Meta:", analiseId, JSON.stringify(fbBody));
    }
  } catch (err) {
    console.error("❌ Erro ao enviar Lead para Meta:", err);
  }
}

export async function sendMetaPurchase({ transactionId, value, currency, email, analiseId, clientIp, userAgent }) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("❌ META_ACCESS_TOKEN ausente");
    return;
  }

  try {
    // action_source "website" depende de client_ip_address/client_user_agent
    // pra qualidade de correspondência — sem isso o Meta pode receber o
    // evento (resposta 200) e mesmo assim não contabilizar/exibir no Ads
    // Manager por falta de sinal suficiente pra casar com uma sessão real.
    const userData = {
      em: [hashEmail(email)].filter(Boolean),
      ...(clientIp && { client_ip_address: clientIp }),
      ...(userAgent && { client_user_agent: userAgent }),
    };

    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
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
              user_data: userData,
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
      console.error("❌ Falha ao enviar Purchase para Meta:", fbRes.status, JSON.stringify(fbBody));
    } else {
      console.log("✅ Purchase enviado à Meta:", transactionId, JSON.stringify(fbBody));
    }
  } catch (err) {
    console.error("❌ Erro ao enviar Purchase para Meta:", err);
  }
}
