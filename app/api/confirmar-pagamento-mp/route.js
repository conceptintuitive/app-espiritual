import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAtualizacaoPagamentoManual } from "@/lib/mpPagamentoManual";

export const runtime = "nodejs";

// Chamada pelo /manual/[id] quando a pessoa chega vinda do redirect do MP
// (?payment_id=...) e o banco ainda não mostra payment_status='paid' — em
// vez de esperar o webhook (que pode levar alguns segundos), consulta a API
// do MP direto e libera na hora se já estiver 'approved'.
//
// Idempotente com o webhook-mp: os dois escrevem exatamente os mesmos
// campos (buildAtualizacaoPagamentoManual), então não importa qual chega
// primeiro — o outro só regrava os mesmos valores. Só o webhook dispara
// e-mail de acesso, geração de IA e eventos de Purchase (Meta/GA4/TikTok);
// essa rota só libera o acesso mais rápido, não duplica esses efeitos.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const analiseId = body?.analiseId;
    const paymentId = body?.paymentId;

    if (!analiseId || !paymentId) {
      return NextResponse.json({ error: "analiseId e paymentId são obrigatórios" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id, payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    // Já liberado (provavelmente o webhook chegou primeiro) — nada a fazer.
    if (analise.payment_status === "paid") {
      return NextResponse.json({ pago: true, ja_processado: true });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!mpResponse.ok) {
      console.error("Erro ao consultar pagamento no MP (confirmação síncrona):", await mpResponse.text());
      return NextResponse.json({ pago: false, error: "Erro ao consultar pagamento" }, { status: 502 });
    }

    const payment = await mpResponse.json();

    // Segurança: sem isso, qualquer payment_id aprovado (de outra compra
    // qualquer) poderia ser usado pra liberar o manual de uma análise alheia.
    if (payment.external_reference !== analiseId) {
      console.error("payment_id não corresponde à análise:", { analiseId, paymentId, externalReference: payment.external_reference });
      return NextResponse.json({ pago: false, error: "Pagamento não corresponde a essa análise" }, { status: 403 });
    }

    if (payment.status !== "approved") {
      return NextResponse.json({ pago: false, status: payment.status });
    }

    const { critica, bookkeeping } = buildAtualizacaoPagamentoManual(payment, paymentId);

    const { error: updateError } = await supabase.from("analises").update(critica).eq("id", analiseId);
    if (updateError) {
      console.error("Erro ao liberar manual (confirmação síncrona):", updateError);
      return NextResponse.json({ pago: false, error: "Erro ao atualizar" }, { status: 500 });
    }

    // Bookkeeping, best-effort — o acesso já foi liberado acima.
    const { error: bookkeepingError } = await supabase.from("analises").update(bookkeeping).eq("id", analiseId);
    if (bookkeepingError) {
      console.error("⚠️ Falha ao gravar valor_pago/origem (confirmação síncrona, já liberado):", bookkeepingError);
    }

    return NextResponse.json({ pago: true });
  } catch (error) {
    console.error("❌ Erro ao confirmar pagamento MP (síncrono):", error);
    return NextResponse.json({ pago: false, error: error.message }, { status: 500 });
  }
}
