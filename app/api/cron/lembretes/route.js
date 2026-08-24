import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { gerarProjecao12Meses } from "@/lib/transitos12meses";
import { gerarGanchoNutricaoLead } from "@/lib/nutricaoLeadTextos";

export const runtime = "nodejs";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Rodapé de descadastro — obrigatório em todo email de marketing/nutrição
// (não nos emails transacionais de "seu acesso está liberado", que a pessoa
// pediu ao comprar). unsubUrl já vem pronta com o id da análise.
function unsubscribeFooterHtml(unsubUrl) {
  return `<p style="margin:18px 0 0;font-size:11px;color:#555;">Não quer mais receber esses emails? <a href="${unsubUrl}" style="color:#888;">Cancelar inscrição</a></p>`;
}
function unsubscribeFooterText(unsubUrl) {
  return `\n\nNão quer mais receber esses emails? Cancele aqui: ${unsubUrl}`;
}

// A mesma pessoa pode ter várias linhas em "analises" (cada vez que preenche
// o formulário de novo cria uma nova, mesmo com o mesmo email). Sem isso, o
// cron manda um email POR LINHA em vez de um por pessoa — foi exatamente o
// bug que inundou a caixa de entrada de alguém que testou o formulário
// várias vezes. Agrupa por email, manda um email usando a linha mais
// recente como referência, e marca TODAS as linhas daquele email como
// processadas (senão as linhas mais antigas voltam a aparecer no próximo run).
function agruparPorEmailMaisRecente(candidatos) {
  const porEmail = new Map();
  for (const row of candidatos || []) {
    const chave = (row.email || "").trim().toLowerCase();
    if (!chave) continue;
    if (!porEmail.has(chave)) porEmail.set(chave, []);
    porEmail.get(chave).push(row);
  }
  const grupos = [];
  for (const rows of porEmail.values()) {
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    grupos.push({ representante: rows[0], todosIds: rows.map((r) => r.id) });
  }
  return grupos;
}

function emailTemplate({ nome, link, variant, unsubUrl }) {
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
    ${unsubscribeFooterHtml(unsubUrl)}
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
      text: `${primeiroNome}, sua análise ainda está aberta.\n\nVeja seu resultado aqui: ${link}${unsubscribeFooterText(unsubUrl)}`,
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
    ${unsubscribeFooterHtml(unsubUrl)}
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
    text: `${primeiroNome}, seu diagnóstico completo ainda está esperando por você: ${link}${unsubscribeFooterText(unsubUrl)}`,
  };
}

async function processarLote({ supabase, resend, baseUrl, variant, coluna, desdeMin, ateMin }) {
  const agora = Date.now();
  const desde = new Date(agora - ateMin * 60_000).toISOString();
  const ate = new Date(agora - desdeMin * 60_000).toISOString();

  const { data: candidatos, error } = await supabase
    .from("analises")
    .select("id,nome,email,created_at")
    .neq("payment_status", "paid")
    .is(coluna, null)
    .not("email", "is", null)
    .or("unsubscribed.is.null,unsubscribed.eq.false")
    .gte("created_at", desde)
    .lte("created_at", ate)
    .limit(200);

  if (error) throw error;

  const grupos = agruparPorEmailMaisRecente(candidatos);
  let enviados = 0;
  for (const { representante: row, todosIds } of grupos) {
    const link = `${baseUrl}/resultado/${row.id}`;
    const unsubUrl = `${baseUrl}/api/unsubscribe?id=${row.id}`;
    const { subject, html, text } = emailTemplate({ nome: row.nome, link, variant, unsubUrl });

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
        .in("id", todosIds);
      enviados += 1;
    } catch (sendError) {
      console.error(`❌ Falha ao enviar lembrete ${variant} para ${row.id}:`, sendError?.message || sendError);
    }
  }

  return { candidatos: candidatos?.length || 0, pessoas: grupos.length, enviados };
}

function emailMesPessoalTemplate({ nome, mes, link, unsubUrl }) {
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
    ${unsubscribeFooterHtml(unsubUrl)}
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
    text: `${primeiroNome}, seu Mês Pessoal de ${mes.label} chegou. ${mes.texto}\n\nVeja seu mês completo: ${link}${unsubscribeFooterText(unsubUrl)}`,
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
    .select("id,nome,email,data_nascimento,tier2_ultimo_email_mes,created_at")
    .eq("tier2_payment_status", "paid")
    .not("email", "is", null)
    .not("data_nascimento", "is", null)
    .or("unsubscribed.is.null,unsubscribed.eq.false")
    .or(`tier2_ultimo_email_mes.is.null,tier2_ultimo_email_mes.neq.${mesAtualLabel}`)
    .limit(200);

  if (error) throw error;

  const grupos = agruparPorEmailMaisRecente(candidatos);
  let enviados = 0;
  for (const { representante: row, todosIds } of grupos) {
    const projecao = gerarProjecao12Meses(row.data_nascimento, hoje);
    const mesAtual = projecao[0];
    if (!mesAtual) continue;

    const link = `${baseUrl}/manual/${row.id}#projecao-12-meses`;
    const unsubUrl = `${baseUrl}/api/unsubscribe?id=${row.id}`;
    const { subject, html, text } = emailMesPessoalTemplate({ nome: row.nome, mes: mesAtual, link, unsubUrl });

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
        .in("id", todosIds);
      enviados += 1;
    } catch (sendError) {
      console.error(`❌ Falha ao enviar email de mês pessoal para ${row.id}:`, sendError?.message || sendError);
    }
  }

  return { candidatos: candidatos?.length || 0, pessoas: grupos.length, enviados };
}

function emailLeadSemanalTemplate({ nome, mes, gancho, link, unsubUrl }) {
  const primeiroNome = (nome || "").toString().trim().split(" ")[0] || "você";
  const ganchoParagrafo = gancho
    ? `<p style="color:#ddd;font-size:14.5px;margin:0 0 16px;line-height:1.6;">${gancho}</p>`
    : "";

  return {
    subject: `${primeiroNome}, essa semana o seu ciclo é sobre ${mes.titulo.toLowerCase()} 🔮`,
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f0f14;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#1a1a24;border-radius:18px;padding:32px;color:#fff;text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#d4a853;">Mês Pessoal ${mes.mesPessoal} · ${mes.label}</p>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${primeiroNome}, seu ciclo atual é sobre ${mes.titulo.toLowerCase()}</h1>
    ${ganchoParagrafo}
    <p style="color:#bbb;font-size:14px;margin:0 0 20px;line-height:1.6;">
      Isso é só o começo do que o seu mapa mostra pra esse momento. O diagnóstico completo — com seus bloqueios, plano de 7 dias e rituais — ainda está esperando por você.
    </p>
    <a href="${link}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
      Ver meu diagnóstico completo
    </a>
    <p style="margin:28px 0 0;font-size:12px;color:#777;">
      Se o botão não funcionar, copie e cole no navegador:<br/>
      <span style="color:#a855f7;">${link}</span>
    </p>
    ${unsubscribeFooterHtml(unsubUrl)}
  </div>
  <p style="text-align:center;font-size:12px;color:#666;margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>`.trim(),
    text: `${primeiroNome}, seu ciclo atual (Mês Pessoal ${mes.mesPessoal}) é sobre ${mes.titulo}.${gancho ? ` ${gancho}` : ""} Veja seu diagnóstico completo: ${link}${unsubscribeFooterText(unsubUrl)}`,
  };
}

// Nutrição quinzenal pra quem fez a prévia grátis mas não comprou — usa o Mês
// Pessoal de cada um (já calculado, sem escrever nada novo) como gancho de
// curiosidade. Só entra na régua depois de alguns dias (pra não se sobrepor
// aos lembretes de 1h/24h), e no máximo uma vez a cada ~15 dias por pessoa
// (o Mês Pessoal só muda uma vez por mês — semanal repetiria o mesmo tema
// 4x seguidas antes de mudar, o que parece falha, não nutrição). Controlado
// por lead_ultima_semana_email (bucket de dias desde epoch / 15 — nome da
// coluna ficou de quando era semanal, não vale a pena migrar só por isso).
async function processarLoteLeadsSemanal({ supabase, resend, baseUrl }) {
  const semanaAtual = String(Math.floor(Date.now() / (15 * 24 * 60 * 60 * 1000)));
  const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidatos, error } = await supabase
    .from("analises")
    .select("id,nome,email,data_nascimento,lead_ultima_semana_email,created_at,signo,numero_vida,objetivo_principal")
    .neq("payment_status", "paid")
    .not("email", "is", null)
    .not("data_nascimento", "is", null)
    .or("unsubscribed.is.null,unsubscribed.eq.false")
    .or(`lead_ultima_semana_email.is.null,lead_ultima_semana_email.neq.${semanaAtual}`)
    .lte("created_at", tresDiasAtras)
    .limit(500);

  if (error) throw error;

  const grupos = agruparPorEmailMaisRecente(candidatos);
  let enviados = 0;
  for (const { representante: row, todosIds } of grupos) {
    const projecao = gerarProjecao12Meses(row.data_nascimento, new Date());
    const mesAtual = projecao[0];
    if (!mesAtual) continue;

    const gancho = gerarGanchoNutricaoLead({
      signo: row.signo,
      numeroVida: row.numero_vida,
      objetivoPrincipal: row.objetivo_principal,
    });
    const link = `${baseUrl}/resultado/${row.id}`;
    const unsubUrl = `${baseUrl}/api/unsubscribe?id=${row.id}`;
    const { subject, html, text } = emailLeadSemanalTemplate({ nome: row.nome, mes: mesAtual, gancho, link, unsubUrl });

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
        .update({ lead_ultima_semana_email: semanaAtual })
        .in("id", todosIds);
      enviados += 1;
    } catch (sendError) {
      console.error(`❌ Falha ao enviar nutrição semanal para ${row.id}:`, sendError?.message || sendError);
    }
  }

  return { candidatos: candidatos?.length || 0, pessoas: grupos.length, enviados };
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
    const loteLeadsSemanal = await processarLoteLeadsSemanal({ supabase, resend, baseUrl });

    return NextResponse.json({ ok: true, lote1h, lote24h, loteMesPessoal, loteLeadsSemanal });
  } catch (error) {
    console.error("❌ Erro no cron de lembretes:", error);
    return NextResponse.json(
      { error: "Erro ao processar lembretes", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
