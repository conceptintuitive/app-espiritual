import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { gerarProjecao12Meses } from "@/lib/transitos12meses";

export const runtime = "nodejs";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function emailTemplate({ nome, link, variant }) {
  const primeiroNome = (nome || "").toString().trim().split(" ")[0] || "você";

  if (variant === "1h") {
    return {
      subject: "Sua análise espiritual ficou te esperando 👀",
      html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f0f14;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a24;border-radius:18px;padding:32px;color:#fff;text-align:center;">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${primeiroNome}, sua análise ainda está aberta ✨</h1>
    <p style="color:#bbb;font-size:14px;margin:0 0 24px;">
      Você chegou até a prévia do seu mapa espiritual, mas não finalizou. Seu diagnóstico completo continua disponível.
    </p>
    <a href="${link}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
      Ver meu resultado
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#777;">
      Se o botão não funcionar, copie e cole no navegador:<br/>
      <span style="color:#a855f7;">${link}</span>
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
      text: `${primeiroNome}, sua análise ainda está aberta.\n\nVeja seu resultado aqui: ${link}`,
    };
  }

  return {
    subject: "Por hoje ainda dá tempo de ver seu diagnóstico completo",
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f0f14;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a24;border-radius:18px;padding:32px;color:#fff;text-align:center;">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${primeiroNome}, seu padrão continua sem nome 🌙</h1>
    <p style="color:#bbb;font-size:14px;margin:0 0 24px;">
      Faz um dia que você viu a prévia do seu mapa. O diagnóstico completo — com seus bloqueios, seu plano de 7 dias e seus rituais — ainda está esperando por você.
    </p>
    <a href="${link}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
      Ver meu diagnóstico completo
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#777;">
      Se o botão não funcionar, copie e cole no navegador:<br/>
      <span style="color:#a855f7;">${link}</span>
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
    text: `${primeiroNome}, seu diagnóstico completo ainda está esperando por você: ${link}`,
  };
}

async function processarLote({ supabase, resend, baseUrl, variant, coluna, desdeMin, ateMin }) {
  const agora = Date.now();
  const desde = new Date(agora - ateMin * 60_000).toISOString();
  const ate = new Date(agora - desdeMin * 60_000).toISOString();

  const { data: candidatos, error } = await supabase
    .from("analises")
    .select("id,nome,email")
    .neq("payment_status", "paid")
    .is(coluna, null)
    .not("email", "is", null)
    .gte("created_at", desde)
    .lte("created_at", ate)
    .limit(200);

  if (error) throw error;

  let enviados = 0;
  for (const row of candidatos || []) {
    if (!row.email) continue;
    const link = `${baseUrl}/resultado/${row.id}`;
    const { subject, html, text } = emailTemplate({ nome: row.nome, link, variant });

    try {
      await resend.emails.send({
        from: "acesso@intuitiveconcept.com.br",
        to: row.email,
        subject,
        html,
        text,
      });
      await supabase
        .from("analises")
        .update({ [coluna]: new Date().toISOString() })
        .eq("id", row.id);
      enviados += 1;
    } catch (sendError) {
      console.error(`❌ Falha ao enviar lembrete ${variant} para ${row.id}:`, sendError?.message || sendError);
    }
  }

  return { candidatos: candidatos?.length || 0, enviados };
}

function emailMesPessoalTemplate({ nome, mes, link }) {
  const primeiroNome = (nome || "").toString().trim().split(" ")[0] || "você";

  return {
    subject: `${primeiroNome}, seu Mês Pessoal de ${mes.label} chegou 🔮`,
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f0f14;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a24;border-radius:18px;padding:32px;color:#fff;text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#d4a853;">Mês Pessoal ${mes.mesPessoal}</p>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${primeiroNome}, este mês é sobre ${mes.titulo.toLowerCase()}</h1>
    <p style="color:#bbb;font-size:14px;margin:0 0 24px;line-height:1.6;">
      ${mes.texto}
    </p>
    <a href="${link}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
      Ver meu mês completo
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#777;">
      Se o botão não funcionar, copie e cole no navegador:<br/>
      <span style="color:#a855f7;">${link}</span>
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
    text: `${primeiroNome}, seu Mês Pessoal de ${mes.label} chegou. ${mes.texto}\n\nVeja seu mês completo: ${link}`,
  };
}

// Reengajamento mensal pra quem já comprou a Projeção de 12 Meses — dispara
// só nos primeiros dias do mês (evita mandar de novo se rodar todo dia) e só
// uma vez por mês por pessoa, controlado por tier2_ultimo_email_mes.
async function processarLoteMesPessoal({ supabase, resend, baseUrl }) {
  const hoje = new Date();
  if (hoje.getDate() > 5) return { candidatos: 0, enviados: 0, motivo: "fora da janela do mês" };

  const mesAtualLabel = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const { data: candidatos, error } = await supabase
    .from("analises")
    .select("id,nome,email,data_nascimento,tier2_ultimo_email_mes")
    .eq("tier2_payment_status", "paid")
    .not("email", "is", null)
    .not("data_nascimento", "is", null)
    .or(`tier2_ultimo_email_mes.is.null,tier2_ultimo_email_mes.neq.${mesAtualLabel}`)
    .limit(200);

  if (error) throw error;

  let enviados = 0;
  for (const row of candidatos || []) {
    if (row.tier2_ultimo_email_mes === mesAtualLabel) continue;

    const projecao = gerarProjecao12Meses(row.data_nascimento, hoje);
    const mesAtual = projecao[0];
    if (!mesAtual) continue;

    const link = `${baseUrl}/manual/${row.id}#projecao-12-meses`;
    const { subject, html, text } = emailMesPessoalTemplate({ nome: row.nome, mes: mesAtual, link });

    try {
      await resend.emails.send({
        from: "acesso@intuitiveconcept.com.br",
        to: row.email,
        subject,
        html,
        text,
      });
      await supabase
        .from("analises")
        .update({ tier2_ultimo_email_mes: mesAtualLabel })
        .eq("id", row.id);
      enviados += 1;
    } catch (sendError) {
      console.error(`❌ Falha ao enviar email de mês pessoal para ${row.id}:`, sendError?.message || sendError);
    }
  }

  return { candidatos: candidatos?.length || 0, enviados };
}

export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization") || "";
    const providedSecret = searchParams.get("secret") || authHeader.replace(/^Bearer\s+/i, "");

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey || !resendKey) {
      return NextResponse.json({ error: "Variáveis de ambiente ausentes" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const resend = new Resend(resendKey);
    const baseUrl = getBaseUrl();

    // Janelas com folga (15 min) para cobrir o intervalo entre execuções do cron
    const lote1h = await processarLote({
      supabase, resend, baseUrl, variant: "1h", coluna: "reminder_1h_sent_at",
      desdeMin: 55, ateMin: 70,
    });
    const lote24h = await processarLote({
      supabase, resend, baseUrl, variant: "24h", coluna: "reminder_24h_sent_at",
      desdeMin: 23 * 60, ateMin: 25 * 60,
    });

    const loteMesPessoal = await processarLoteMesPessoal({ supabase, resend, baseUrl });

    return NextResponse.json({ ok: true, lote1h, lote24h, loteMesPessoal });
  } catch (error) {
    console.error("❌ Erro no cron de lembretes:", error);
    return NextResponse.json(
      { error: "Erro ao processar lembretes", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
