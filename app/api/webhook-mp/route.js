import { NextResponse, after } from "next/server";
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

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📩 Webhook MP recebido:", JSON.stringify(body));

    // O MP manda vários tipos de notificação; só nos interessa "payment"
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "Sem payment ID" }, { status: 400 });
    }

    // Busca os detalhes do pagamento na API do MP
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mpResponse.ok) {
      console.error("Erro ao buscar pagamento:", await mpResponse.text());
      return NextResponse.json({ error: "Erro ao buscar pagamento" }, { status: 500 });
    }

    const payment = await mpResponse.json();
    console.log("💰 Status do pagamento:", payment.status, "| external_reference:", payment.external_reference);

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true, status: payment.status });
    }

    // external_reference = analiseId (definido na criação da preferência)
    const analiseId = payment.external_reference;
    if (!analiseId) {
      console.error("Pagamento aprovado mas sem external_reference");
      return NextResponse.json({ error: "Sem referência" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { error: updateError } = await supabase
      .from("analises")
      .update({
        payment_status: "paid",
        mp_payment_id: paymentId.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    if (updateError) {
      console.error("Erro ao atualizar Supabase:", updateError);
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }

    // Busca o email da análise pra enviar o link do manual
    const { data: analiseData } = await supabase
      .from("analises")
      .select("email")
      .eq("id", analiseId)
      .single();

    if (analiseData?.email) {
      try {
        await fetch("https://intuitiveconcept.com.br/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: analiseData.email, manualId: analiseId }),
        });
        console.log("📧 Email enviado para", analiseData.email);
      } catch (emailErr) {
        console.error("Erro ao enviar email:", emailErr);
      }
    }

    // Fire-and-forget: geração de IA após responder ao MP
    after(async () => {
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
            console.log("✅ Conteúdo IA gerado (MP):", Object.keys(updates).join(", "));
          } else {
            console.log("ℹ️ Todas as seções já estavam geradas — nada a fazer");
          }
        }
      } catch (iaErr) {
        console.error("❌ Erro ao gerar conteúdo IA (MP):", iaErr?.message || iaErr);
      }

      // GA4 purchase ───────────────────────────────────────────────────────────
      await sendGA4Purchase({
        transactionId: paymentId.toString(),
        value: payment.transaction_amount ?? 0,
        currency: (payment.currency_id || "BRL").toUpperCase(),
        clientId: `server.${paymentId}`,
      });

      // TikTok CompletePayment ─────────────────────────────────────────────────
      await sendTikTokPurchase({
        transactionId: paymentId.toString(),
        value: payment.transaction_amount ?? 0,
        currency: (payment.currency_id || "BRL").toUpperCase(),
        email: analiseData?.email,
      });
    });

    console.log("✅ Análise", analiseId, "marcada como paga via MP");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook MP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
