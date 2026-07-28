// app/api/cron/lembretes/route.js
// Recuperação de carrinho: lembra por email quem gerou a análise mas não comprou.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function primeiroNome(nome) {
  const t = (nome ?? "").toString().trim();
  if (!t) return "";
  const first = t.split(" ")[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

async function enviarLembrete(resend, { email, nome, id, tier }) {
  const link = `${getBaseUrl()}/resultado/${id}`;
  const firstName = primeiroNome(nome);
  const saudacao = firstName ? `${firstName}, ` : "";

  const assunto =
    tier === 1
      ? `${firstName || "Seu"} manual ainda está te esperando`
      : `${firstName || "Última chance"}: seu Manual Premium ainda está disponível`;

  const corpo =
    tier === 1
      ? "O seu diagnóstico já mostrou parte do seu padrão. O manual completo, com todas as seções personalizadas pra você, ainda está esperando."
      : "Essa é a última vez que vamos te lembrar: o seu Manual Premium personalizado continua disponível, mas essa análise não vai ficar aberta pra sempre.";

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f0f14;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a24;border-radius:18px;padding:32px;color:#fff;text-align:center;">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${saudacao}seu manual ainda está aqui ✨</h1>
    <p style="color:#bbb;font-size:14px;margin:0 0 24px;">${corpo}</p>
    <a href="${link}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
      Ver meu diagnóstico
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#777;">
      Se o botão não funcionar, copie e cole no navegador:<br/>
      <span style="color:#a855f7;">${link}</span>
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">
    Com carinho,<br/>Equipe Intuitive Concept ✨
  </p>
</div>`.trim();

  await resend.emails.send({
    from: "acesso@intuitiveconcept.com.br",
    reply_to: "conceptintuitive@gmail.com",
    to: email,
    subject: assunto,
    html,
    text: `${corpo}\n\nAcesse aqui: ${link}`,
  });
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const resultado = { tier1_enviados: 0, tier2_enviados: 0, erros: [] };

  // Tier 1: análise pendente há mais de 1h, primeiro lembrete ainda não enviado
  const { data: tier1, error: erroTier1 } = await supabase
    .from("analises")
    .select("id, nome, email")
    .eq("payment_status", "pending")
    .is("lembrete_1_enviado_em", null)
    .lte("created_at", umaHoraAtras)
    .not("email", "is", null);

  if (erroTier1) resultado.erros.push(erroTier1.message);

  for (const row of tier1 ?? []) {
    try {
      await enviarLembrete(resend, { email: row.email, nome: row.nome, id: row.id, tier: 1 });
      await supabase
        .from("analises")
        .update({ lembrete_1_enviado_em: new Date().toISOString() })
        .eq("id", row.id);
      resultado.tier1_enviados += 1;
    } catch (e) {
      resultado.erros.push(`tier1:${row.id}:${e?.message || e}`);
    }
  }

  // Tier 2: análise pendente há mais de 24h, já recebeu o lembrete 1 mas não o 2
  const { data: tier2, error: erroTier2 } = await supabase
    .from("analises")
    .select("id, nome, email")
    .eq("payment_status", "pending")
    .not("lembrete_1_enviado_em", "is", null)
    .is("lembrete_2_enviado_em", null)
    .lte("created_at", vinteQuatroHorasAtras)
    .not("email", "is", null);

  if (erroTier2) resultado.erros.push(erroTier2.message);

  for (const row of tier2 ?? []) {
    try {
      await enviarLembrete(resend, { email: row.email, nome: row.nome, id: row.id, tier: 2 });
      await supabase
        .from("analises")
        .update({ lembrete_2_enviado_em: new Date().toISOString() })
        .eq("id", row.id);
      resultado.tier2_enviados += 1;
    } catch (e) {
      resultado.erros.push(`tier2:${row.id}:${e?.message || e}`);
    }
  }

  return NextResponse.json({ success: true, ...resultado });
}
