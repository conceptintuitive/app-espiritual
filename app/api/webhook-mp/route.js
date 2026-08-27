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
import { sendMetaPurchase } from "@/lib/meta";

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

    // external_reference = analiseId (definido na criação da preferência), ou
    // "analiseId__upsell" pra compra de um ou mais bônus (Projeção de 12
    // Meses e/ou Human Design) — qual(is) produto(s) vem do metadata.
    // "analiseId__compat" é a Compatibilidade Completa (produto único).
    // "analiseId__tier2" é o formato legado (só Projeção de 12 Meses),
    // mantido pra não quebrar preferências já criadas antes dessa mudança.
    const rawReference = payment.external_reference;
    if (!rawReference) {
      console.error("Pagamento aprovado mas sem external_reference");
      return NextResponse.json({ error: "Sem referência" }, { status: 400 });
    }

    const isUpsell = rawReference.endsWith("__upsell");
    const isCompat = rawReference.endsWith("__compat");
    const isTier2Legado = rawReference.endsWith("__tier2");
    const analiseId = isUpsell
      ? rawReference.slice(0, -"__upsell".length)
      : isCompat
      ? rawReference.slice(0, -"__compat".length)
      : isTier2Legado
      ? rawReference.slice(0, -"__tier2".length)
      : rawReference;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    if (isUpsell || isTier2Legado) {
      const incluiProjecao =
        isTier2Legado ||
        payment.metadata?.inclui_projecao12m === true ||
        payment.metadata?.inclui_projecao12m === "true";
      const incluiHumanDesign =
        payment.metadata?.inclui_humandesign === true ||
        payment.metadata?.inclui_humandesign === "true";

      const updates = { updated_at: new Date().toISOString() };
      if (incluiProjecao) {
        updates.tier2_payment_status = "paid";
        updates.tier2_mp_payment_id = paymentId.toString();
        updates.tier2_paid_at = new Date().toISOString();
      }
      if (incluiHumanDesign) {
        updates.hd_payment_status = "paid";
        updates.hd_mp_payment_id = paymentId.toString();
        updates.hd_paid_at = new Date().toISOString();
      }

      const { error: upsellUpdateError } = await supabase
        .from("analises")
        .update(updates)
        .eq("id", analiseId);

      if (upsellUpdateError) {
        console.error("Erro ao atualizar upsell no Supabase:", upsellUpdateError);
        return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
      }

      after(async () => {
        await sendGA4Purchase({
          transactionId: paymentId.toString(),
          value: payment.transaction_amount ?? 0,
          currency: (payment.currency_id || "BRL").toUpperCase(),
          clientId: `server.${paymentId}`,
        });
      });

      console.log(
        "✅ Upsell da análise", analiseId, "marcado como pago via MP —",
        [incluiProjecao && "Projeção de 12 Meses", incluiHumanDesign && "Human Design"].filter(Boolean).join(", ")
      );
      return NextResponse.json({ success: true, upsell: true, incluiProjecao, incluiHumanDesign });
    }

    if (isCompat) {
      const { error: compatUpdateError } = await supabase
        .from("analises")
        .update({
          compat_payment_status: "paid",
          compat_mp_payment_id: paymentId.toString(),
          compat_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", analiseId);

      if (compatUpdateError) {
        console.error("Erro ao atualizar compatibilidade no Supabase:", compatUpdateError);
        return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
      }

      after(async () => {
        await sendGA4Purchase({
          transactionId: paymentId.toString(),
          value: payment.transaction_amount ?? 0,
          currency: (payment.currency_id || "BRL").toUpperCase(),
          clientId: `server.${paymentId}`,
        });
      });

      console.log("✅ Compatibilidade Completa da análise", analiseId, "marcada como paga via MP");
      return NextResponse.json({ success: true, compat: true });
    }

    // Se o checkout foi feito com o bônus junto (opção "incluir tier2" no
    // /resultado, +R$50 = preço combo), o metadata da preferência carrega
    // isso até o pagamento — desbloqueia os dois bônus, não só um.
    const includesTier2 = payment.metadata?.includes_tier2 === true || payment.metadata?.includes_tier2 === "true";
    const includesHd = payment.metadata?.includes_hd === true || payment.metadata?.includes_hd === "true";

    const { error: updateError } = await supabase
      .from("analises")
      .update({
        payment_status: "paid",
        mp_payment_id: paymentId.toString(),
        updated_at: new Date().toISOString(),
        ...(includesTier2 && {
          tier2_payment_status: "paid",
          tier2_mp_payment_id: paymentId.toString(),
          tier2_paid_at: new Date().toISOString(),
        }),
        ...(includesHd && {
          hd_payment_status: "paid",
          hd_mp_payment_id: paymentId.toString(),
          hd_paid_at: new Date().toISOString(),
        }),
      })
      .eq("id", analiseId);

    if (updateError) {
      console.error("Erro ao atualizar Supabase:", updateError);
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }

    // Busca o email da análise pra enviar o link do manual — se for presente,
    // manda pro destinatário (presente_email), não pra quem pagou.
    const { data: analiseData } = await supabase
      .from("analises")
      .select("email,presente_email,presente_de")
      .eq("id", analiseId)
      .single();

    const emailDestino = analiseData?.presente_email || analiseData?.email;
    if (emailDestino) {
      try {
        await fetch("https://intuitiveconcept.com.br/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailDestino,
            manualId: analiseId,
            ...(analiseData?.presente_email && { presenteDe: analiseData?.presente_de || "" }),
          }),
        });
        console.log("📧 Email enviado para", emailDestino, analiseData?.presente_email ? "(presente)" : "");
      } catch (emailErr) {
        console.error("Erro ao enviar email:", emailErr);
      }
    }

    // Fire-and-forget: geração de IA após responder ao MP
    after(async () => {
      // IP/user-agent do cliente, capturados na criação do checkout — select
      // isolado e best-effort, de propósito: se a coluna ainda não existir
      // no banco (deploy antes da migração rodar), essa falha não pode se
      // propagar pro select de geração de IA logo abaixo.
      let checkoutIp = null;
      let checkoutUserAgent = null;
      try {
        const { data: trackingData, error: trackingErr } = await supabase
          .from("analises")
          .select("checkout_ip, checkout_user_agent")
          .eq("id", analiseId)
          .single();
        if (trackingErr) {
          console.error("⚠️ Não foi possível ler checkout_ip/checkout_user_agent (coluna existe?):", trackingErr.message);
        } else {
          checkoutIp = trackingData?.checkout_ip || null;
          checkoutUserAgent = trackingData?.checkout_user_agent || null;
        }
      } catch (trackingCatchErr) {
        console.error("⚠️ Erro ao ler checkout_ip/checkout_user_agent:", trackingCatchErr?.message || trackingCatchErr);
      }

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
        analiseId,
      });

      // Meta Purchase ───────────────────────────────────────────────────────────
      await sendMetaPurchase({
        transactionId: paymentId.toString(),
        value: payment.transaction_amount ?? 0,
        currency: (payment.currency_id || "BRL").toUpperCase(),
        email: analiseData?.email,
        analiseId,
        clientIp: checkoutIp,
        userAgent: checkoutUserAgent,
      });
    });

    console.log("✅ Análise", analiseId, "marcada como paga via MP");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook MP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
