import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPrecoManual, PRECO_MANUAL_PADRAO } from "@/lib/preco";

export const runtime = "nodejs";

// Endpoint leve só pra saber se uma análise já foi paga — usado pelos cards
// do /explorar (Manual, Previsão do Ano, Human Design), pra não oferecer
// "Desbloquear" pra quem já comprou, e pra mostrar o preço certo do Manual
// (R$27 ou R$47, conforme a janela de 24h) sem o card precisar saber o
// cálculo. Nenhum dado pessoal.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ pago: false, precoAtual: PRECO_MANUAL_PADRAO, tier2Pago: false, hdPago: false });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("analises")
      .select("payment_status, created_at, tier2_payment_status, hd_payment_status")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      pago: data?.payment_status === "paid",
      precoAtual: getPrecoManual(data?.created_at),
      tier2Pago: data?.tier2_payment_status === "paid",
      hdPago: data?.hd_payment_status === "paid",
    });
  } catch (error) {
    // Falha aqui não pode travar a página — assume "não pago" em tudo (pior
    // caso é mostrar a oferta de novo pra quem já comprou, não o contrário)
    // e o preço padrão do Manual (quem decide o valor de verdade é o
    // checkout, não aqui).
    console.error("❌ Erro ao buscar status da análise:", error);
    return NextResponse.json({ pago: false, precoAtual: PRECO_MANUAL_PADRAO, tier2Pago: false, hdPago: false });
  }
}
