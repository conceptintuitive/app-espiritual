import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPrecoManual, PRECO_MANUAL_PADRAO } from "@/lib/preco";

export const runtime = "nodejs";

// Endpoint leve só pra saber se uma análise já foi paga — usado pelo card
// "Seu Manual Completo" em /explorar, pra não oferecer "Desbloquear" pra
// quem já comprou, e pra mostrar o preço certo (R$27 ou R$47, conforme a
// janela de 24h) sem o card precisar saber o cálculo. Nenhum dado pessoal.
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
      return NextResponse.json({ pago: false, precoAtual: PRECO_MANUAL_PADRAO });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("analises")
      .select("payment_status, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      pago: data?.payment_status === "paid",
      precoAtual: getPrecoManual(data?.created_at),
    });
  } catch (error) {
    // Falha aqui não pode travar a página — assume "não pago" (pior caso é
    // mostrar a oferta de novo pra alguém que já comprou, não o contrário)
    // e o preço padrão (pior caso é não mostrar o desconto, nunca cobrar
    // errado — quem decide o valor de verdade é o checkout, não aqui).
    console.error("❌ Erro ao buscar status da análise:", error);
    return NextResponse.json({ pago: false, precoAtual: PRECO_MANUAL_PADRAO });
  }
}
