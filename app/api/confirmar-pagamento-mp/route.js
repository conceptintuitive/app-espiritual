import { NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { liberarAcessoManual, dispararPosPagamentoManual } from "@/lib/mpPagamentoManual";

export const runtime = "nodejs";

// Chamada pelo /manual/[id] quando a pessoa chega vinda do redirect do MP
// (?payment_id=...) e o banco ainda não mostra payment_status='paid' — em
// vez de esperar o webhook (que pode levar alguns segundos), consulta a API
// do MP direto e libera na hora se já estiver 'approved'.
//
// Idempotente com o webhook-mp: os dois usam lib/mpPagamentoManual.js, que
// garante que o pós-pagamento (e-mail de acesso) roda uma vez só mesmo se
// os dois caminhos chegarem juntos — ver os comentários lá.
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

    // MP só preenche payer.phone quando o checkout pediu/coletou esse dado —
    // mesmo tratamento defensivo que o webhook já faz.
    const payerPhone = payment.payer?.phone?.number
      ? `${payment.payer.phone.area_code || ""}${payment.payer.phone.number}`
      : null;

    const { ok: liberado, error: updateError } = await liberarAcessoManual({
      supabase, analiseId, payment, paymentId,
    });
    if (!liberado) {
      console.error("Erro ao liberar manual (confirmação síncrona):", updateError);
      return NextResponse.json({ pago: false, error: "Erro ao atualizar" }, { status: 500 });
    }

    // Responde rápido pro front desbloquear a tela — IA/e-mail/Purchase
    // seguem em background (a geração de IA tem seu próprio fallback via
    // app/api/gerar-manual-completo, disparado pelo front assim que
    // hasPaid vira true; aqui só cuida de Purchase + e-mail de acesso).
    after(async () => {
      await dispararPosPagamentoManual({ supabase, analiseId, payment, paymentId, payerPhone });
    });

    return NextResponse.json({ pago: true });
  } catch (error) {
    console.error("❌ Erro ao confirmar pagamento MP (síncrono):", error);
    return NextResponse.json({ pago: false, error: error.message }, { status: 500 });
  }
}
