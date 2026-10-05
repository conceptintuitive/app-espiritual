import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Endpoint leve só pra saber se uma análise já foi paga — usado pelo card
// "Seu Manual Completo" em /explorar, pra não oferecer "Desbloquear" pra
// quem já comprou. Devolve só um boolean, nada de dado pessoal.
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
      return NextResponse.json({ pago: false });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("analises")
      .select("payment_status")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ pago: data?.payment_status === "paid" });
  } catch (error) {
    // Falha aqui não pode travar a página — assume "não pago" (pior caso é
    // mostrar a oferta de novo pra alguém que já comprou, não o contrário).
    console.error("❌ Erro ao buscar status da análise:", error);
    return NextResponse.json({ pago: false });
  }
}
