// lib/meta.js
// Eventos da Meta Conversions API (server-side). Puro no montador
// (payloadEventoMeta, testado em tests/meta.test.js) + o envio.
//   Lead        app/api/gerar-analise/route.js (quiz concluído). event_id
//               "lead-<id da análise>" = o mesmo eventID do fbq('track','Lead')
//               que o app/page.js dispara depois da análise criada: a Meta
//               junta os dois (deduplicação) em vez de contar 2 leads.
//   StartTrial  começo do teste de 7 dias do Seu Dia Completo: checkbox do
//               quiz (gerar-analise) ou 1º cadastro na Minha Área
//               (app/api/seu-dia/perfil). Só servidor; 1x por pessoa
//               (event_id pelo e-mail).
//   Purchase    webhooks de pagamento (Stripe e Mercado Pago) e
//               lib/mpPagamentoManual.js, após confirmação.
// user_data: e-mail e telefone em hash, IP e navegador, e fbc/fbp (clique do
// anúncio e cookie do Pixel) só quando a pessoa aceitou cookies
// (cookiesMeta, lib/atribuicao.js). META_TEST_EVENT_CODE (opcional) manda o
// test_event_code: os eventos aparecem em "Testar eventos" do Gerenciador.
import { createHash } from "crypto";
import { cookiesMeta } from "./atribuicao.js";

export const META_PIXEL_ID = "1012756614970977";
const SITE = "https://intuitiveconcept.com.br";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

function hashEmail(email) {
  if (!email) return undefined;
  return sha256(email.trim().toLowerCase());
}

// Meta exige o telefone normalizado antes do hash: só dígitos, com código do
// país, sem zero à esquerda. Assume Brasil (55) quando o número não vem com
// código de país já incluído.
function hashPhone(phone) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return undefined;
  const comCodigoPais = digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
  return sha256(comCodigoPais);
}

/** event_id do StartTrial: o mesmo pra mesma pessoa (a Meta descarta repetido). */
export const idDoTeste = (email) => `trial-${sha256(String(email || "").trim().toLowerCase()).slice(0, 24)}`;

/**
 * Corpo do POST /{pixel}/events.
 * @param {{ nome: string, eventId: string, sourceUrl: string, email?: string, phone?: string,
 *   clientIp?: string, userAgent?: string, atribuicao?: object|null, custom?: object,
 *   agora?: number, testCode?: string }} p
 */
export function payloadEventoMeta({ nome, eventId, sourceUrl, email, phone, clientIp, userAgent, atribuicao = null, custom = null, agora = Date.now(), testCode = process.env.META_TEST_EVENT_CODE }) {
  const em = hashEmail(email);
  const ph = hashPhone(phone);
  const userData = {
    ...(em && { em: [em] }),
    ...(ph && { ph: [ph] }),
    ...(clientIp && { client_ip_address: clientIp }),
    ...(userAgent && { client_user_agent: userAgent }),
    ...cookiesMeta(atribuicao),
  };
  const evento = {
    event_name: nome,
    event_time: Math.floor(agora / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: userData,
    ...(custom && { custom_data: custom }),
  };
  const corpo = { data: [evento] };
  if (testCode && String(testCode).trim()) corpo.test_event_code = String(testCode).trim();
  return corpo;
}

async function enviar(corpo, rotulo) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("❌ META_ACCESS_TOKEN ausente");
    return;
  }
  const { event_name: nome, event_id: id } = corpo.data[0];
  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) }
    );
    const fbBody = await fbRes.json().catch(() => ({}));
    if (!fbRes.ok) console.error(`❌ Falha ao enviar ${nome} para Meta:`, fbRes.status, JSON.stringify(fbBody));
    else console.log(`✅ ${nome} enviado à Meta:`, rotulo || id, corpo.test_event_code ? "(teste)" : "", JSON.stringify(fbBody));
  } catch (err) {
    console.error(`❌ Erro ao enviar ${nome} para Meta:`, err);
  }
}

export async function sendMetaLead({ email, phone, analiseId, clientIp, userAgent, atribuicao = null }) {
  await enviar(payloadEventoMeta({
    nome: "Lead",
    eventId: `lead-${analiseId}`,
    sourceUrl: `${SITE}/resultado/${analiseId}`,
    email, phone, clientIp, userAgent, atribuicao,
  }), analiseId);
}

/**
 * Começo do teste grátis de 7 dias do Seu Dia Completo.
 * @param {{ email: string, phone?: string, clientIp?: string, userAgent?: string, atribuicao?: object|null, origem: 'quiz'|'minha-area' }} p
 */
export async function sendMetaStartTrial({ email, phone = null, clientIp, userAgent, atribuicao = null, origem }) {
  if (!email) return;
  await enviar(payloadEventoMeta({
    nome: "StartTrial",
    eventId: idDoTeste(email),
    sourceUrl: origem === "quiz" ? `${SITE}/` : `${SITE}/seu-dia`,
    email, phone, clientIp, userAgent, atribuicao,
    custom: { currency: "BRL", value: 0, content_name: "Seu Dia Completo (7 dias grátis)", content_category: origem },
  }), origem);
}

export async function sendMetaPurchase({ transactionId, value, currency, email, phone, analiseId, clientIp, userAgent, atribuicao = null, contentName = "Manual Premium Personalizado" }) {
  // action_source "website" depende de client_ip_address/client_user_agent
  // pra qualidade de correspondência — sem isso o Meta pode receber o
  // evento (resposta 200) e mesmo assim não contabilizar/exibir no Ads
  // Manager por falta de sinal suficiente pra casar com uma sessão real.
  // phone é opcional — nem Stripe nem MP garantem esse dado em toda
  // transação (ver comentário em cima de quem chama esta função).
  await enviar(payloadEventoMeta({
    nome: "Purchase",
    eventId: transactionId,
    sourceUrl: `${SITE}/manual/${analiseId}`,
    email, phone, clientIp, userAgent, atribuicao,
    custom: { value, currency, content_ids: [analiseId], content_type: "product", content_name: contentName },
  }), transactionId);
}
