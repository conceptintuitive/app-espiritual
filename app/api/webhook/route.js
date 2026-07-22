// app/api/webhook/stripe/route.js
import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  buildDiagnosticoCtx, buildAmorCtx, buildTipoPessoaCtx, buildPlano7Ctx,
  buildArquetiposCtx, buildPontoCegoCtx, buildBloqueiosCtx, buildDinheiroCtx,
  buildRituaisCtx, buildObjetivoCtx, buildLeituraCtx, buildCalendarioCtx,
  buildFechamentoCtx, buildMapaCtx,
} from "@/lib/manualgenerator";
import {
  gerarDiagnosticoIA, gerarAmorIA, gerarTipoPessoaIA, gerarPlano7IA,
  gerarArquetiposIA, gerarPontoCegoIA, gerarBloqueiosIA, gerarDinheiroIA,
  gerarRituaisIA, gerarObjetivoIA, gerarLeituraIA, gerarCalendarioIA,
  gerarFechamentoIA, gerarSinteseIA,
} from "@/lib/ia";
import { sendGA4Purchase } from "@/lib/ga4";
import { sendTikTokPurchase } from "@/lib/tiktok";

// ─── Lógica compartilhada entre pagamento síncrono e assíncrono (boleto) ──────
async function handlePaymentSuccess(session, supabase) {
  const analiseId = session.metadata?.analise_id;
  if (!analiseId) {
    console.error("❌ analise_id não encontrado nos metadata");
    return;
  }

  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    console.error("❌ Email do cliente não encontrado na session:", session.id);
    return;
  }

  console.log("✅ Pagamento aprovado:", session.id, "| Análise:", analiseId, "| Email:", email);

  // Crítico: atualiza status antes de responder ao Stripe
  const { error: updateError } = await supabase
    .from("analises")
    .update({
      payment_status: "paid",
      stripe_payment_intent: session.payment_intent,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", analiseId);

  if (updateError) {
    console.error("❌ Erro ao atualizar status de pagamento:", updateError);
    return;
  }

  console.log('✅ Status atualizado para "paid"');

  // Fire-and-forget: roda após o 200 ser enviado ao Stripe
  after(async () => {
    // Geração de IA ────────────────────────────────────────────────────────────
    try {
      const { data: analise, error: analiseErr } = await supabase
        .from("analises")
        .select(`
          nome, signo, numero_vida, objetivo_principal, relacao_status, trabalho_status,
          signo_lua, signo_venus, signo_marte, signo_nodo, signo_mercurio, signo_ascendente,
          ano_pessoal, numero_alma, numero_expressao,
          sintese_gerada, diagnostico_gerado, amor_gerado, tipo_pessoa_gerado,
          plano7_gerado, arquetipos_gerado, ponto_cego_gerado, bloqueios_gerado,
          dinheiro_gerado, rituais_gerado, objetivo_gerado, leitura_gerada,
          calendario_gerado, fechamento_gerado
        `)
        .eq("id", analiseId)
        .single();

      if (!analiseErr && analise) {
        // Um único Promise.all — só gera seções que ainda estão null
        const [
          sintese, diagnostico, amor, tipoPessoa, plano7, arquetipos,
          pontoCego, bloqueios, dinheiro, rituais, objetivo, leitura,
          calendario, fechamento,
        ] = await Promise.all([
          !analise.sintese_gerada     ? gerarSinteseIA(buildMapaCtx(analise)).catch(() => null)            : null,
          !analise.diagnostico_gerado ? gerarDiagnosticoIA(buildDiagnosticoCtx(analise)).catch(() => null) : null,
          !analise.amor_gerado        ? gerarAmorIA(buildAmorCtx(analise)).catch(() => null)               : null,
          !analise.tipo_pessoa_gerado ? gerarTipoPessoaIA(buildTipoPessoaCtx(analise)).catch(() => null)   : null,
          !analise.plano7_gerado      ? gerarPlano7IA(buildPlano7Ctx(analise)).catch(() => null)           : null,
          !analise.arquetipos_gerado  ? gerarArquetiposIA(buildArquetiposCtx(analise)).catch(() => null)   : null,
          !analise.ponto_cego_gerado  ? gerarPontoCegoIA(buildPontoCegoCtx(analise)).catch(() => null)    : null,
          !analise.bloqueios_gerado   ? gerarBloqueiosIA(buildBloqueiosCtx(analise)).catch(() => null)     : null,
          !analise.dinheiro_gerado    ? gerarDinheiroIA(buildDinheiroCtx(analise)).catch(() => null)       : null,
          !analise.rituais_gerado     ? gerarRituaisIA(buildRituaisCtx(analise)).catch(() => null)         : null,
          !analise.objetivo_gerado    ? gerarObjetivoIA(buildObjetivoCtx(analise)).catch(() => null)       : null,
          !analise.leitura_gerada     ? gerarLeituraIA(buildLeituraCtx(analise)).catch(() => null)         : null,
          !analise.calendario_gerado  ? gerarCalendarioIA(buildCalendarioCtx(analise)).catch(() => null)   : null,
          !analise.fechamento_gerado  ? gerarFechamentoIA(buildFechamentoCtx(analise)).catch(() => null)   : null,
        ]);

        const updates = {};
        if (sintese)     updates.sintese_gerada      = JSON.stringify(sintese);
        if (diagnostico) updates.diagnostico_gerado  = JSON.stringify(diagnostico);
        if (amor)        updates.amor_gerado          = JSON.stringify(amor);
        if (tipoPessoa)  updates.tipo_pessoa_gerado   = JSON.stringify(tipoPessoa);
        if (plano7)      updates.plano7_gerado        = JSON.stringify(plano7);
        if (arquetipos)  updates.arquetipos_gerado    = JSON.stringify(arquetipos);
        if (pontoCego)   updates.ponto_cego_gerado    = JSON.stringify(pontoCego);
        if (bloqueios)   updates.bloqueios_gerado     = JSON.stringify(bloqueios);
        if (dinheiro)    updates.dinheiro_gerado      = JSON.stringify(dinheiro);
        if (rituais)     updates.rituais_gerado       = JSON.stringify(rituais);
        if (objetivo)    updates.objetivo_gerado      = JSON.stringify(objetivo);
        if (leitura)     updates.leitura_gerada       = JSON.stringify(leitura);
        if (calendario)  updates.calendario_gerado    = JSON.stringify(calendario);
        if (fechamento)  updates.fechamento_gerado    = JSON.stringify(fechamento);

        if (Object.keys(updates).length) {
          await supabase.from("analises").update(updates).eq("id", analiseId);
          console.log("✅ Conteúdo IA gerado:", Object.keys(updates).join(", "));
        } else {
          console.log("ℹ️ Todas as seções já estavam geradas — nada a fazer");
        }
      }
    } catch (iaErr) {
      console.error("❌ Erro ao gerar conteúdo IA:", iaErr?.message || iaErr);
    }

    // GA4 purchase ─────────────────────────────────────────────────────────────
    await sendGA4Purchase({
      transactionId: session.id,
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency || "brl").toUpperCase(),
      clientId: `server.${session.id}`,
    });

    // TikTok CompletePayment ───────────────────────────────────────────────────
    await sendTikTokPurchase({
      transactionId: session.id,
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency || "brl").toUpperCase(),
      email,
      analiseId,
    });

    // Email de acesso ──────────────────────────────────────────────────────────
    try {
      const sendRes = await fetch("https://intuitiveconcept.com.br/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, manualId: analiseId }),
      });

      const sendBody = await sendRes.json().catch(() => ({}));

      if (!sendRes.ok) {
        console.error("❌ Falha ao enviar email:", sendRes.status, sendBody);
      } else {
        console.log("✅ Email enviado com sucesso:", sendBody);
      }
    } catch (err) {
      console.error("❌ Erro ao enviar email:", err);
    }
  });
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig || !webhookSecret) {
      console.error("❌ Webhook signature ou secret não configurados");
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("❌ Erro ao verificar webhook:", err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      // Pagamento síncrono (cartão) — só processa se já veio confirmado
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await handlePaymentSuccess(session, supabase);
        } else {
          // payment_status === "unpaid" → boleto emitido, aguarda confirmação
          console.log("ℹ️ Checkout completo com pagamento pendente (boleto):", session.id);
        }
        break;
      }

      // Pagamento assíncrono confirmado (boleto, débito, etc.)
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        await handlePaymentSuccess(session, supabase);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        console.error("❌ Pagamento assíncrono falhou:", session.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.error("❌ Pagamento falhou:", paymentIntent.id);
        break;
      }

      default:
        console.log(`ℹ️ Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro geral no webhook:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
