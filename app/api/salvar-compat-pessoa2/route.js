import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Salva os dados da segunda pessoa pro bônus GRÁTIS de Compatibilidade
// Completa — só disponível de graça pra quem já comprou o manual completo.
// Quem ainda não comprou o manual usa o checkout pago em
// /api/criar-checkout-compat-mp (R$29,90 avulso).
export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const body = await request.json().catch(() => null);
    const analiseId = body?.analiseId;
    const pessoa2Nome = String(body?.pessoa2Nome || "").trim();
    const pessoa2DataNascimento = String(body?.pessoa2DataNascimento || "").trim();

    if (!analiseId || !pessoa2Nome || !/^\d{4}-\d{2}-\d{2}$/.test(pessoa2DataNascimento)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }
    if (analise.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Esse bônus é grátis só pra quem já tem o manual completo" },
        { status: 400 }
      );
    }

    await supabase
      .from("analises")
      .update({
        compat_pessoa2_nome: pessoa2Nome,
        compat_pessoa2_data_nascimento: pessoa2DataNascimento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro ao salvar segunda pessoa (compat grátis):", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
