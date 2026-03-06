// app/api/criar-checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // força Node (Stripe não roda no Edge)

function getBaseUrl() {
  // 1) Preferido (você controla)
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  // 2) Vercel
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 3) Dev
  return "http://localhost:3000";
}

export async function POST(request) {
  try {
    // ✅ valida ENV AQUI DENTRO (não no topo)
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }
    if (!supabaseKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    // ✅ cria clientes aqui dentro
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

  const body = await request.json().catch(() => null);
const analiseId = body?.analiseId;

if (!analiseId) {
  return NextResponse.json(
    { error: "ID da análise é obrigatório" },
    { status: 400 }
  );
}

const { data: analise, error: analiseError } = await supabase
  .from("analises")
  .select("id,nome,email,payment_status")
  .eq("id", analiseId)
  .single();

// 👇 COLOCA AQUI
console.log("analise encontrada:", analise);
console.log("payment_status:", analise?.payment_status);

if (analiseError || !analise) {
  return NextResponse.json(
    { error: "Análise não encontrada", details: analiseError?.message || null },
    { status: 404 }
  );
}

if (analise.payment_status === "paid") {
  return NextResponse.json(
    { error: "Esta análise já foi paga" },
    { status: 400 }
  );
}

    const baseUrl = getBaseUrl();

    const sessionParams = {
  mode: "payment",
  payment_method_types: ["card"],
  line_items: [
    {
      price_data: {
        currency: "brl",
        product_data: {
          name: "Manual Premium Personalizado",
          description: `Relatório personalizado completo para ${analise.nome ?? "você"}`,
        },
        unit_amount: 4700,
      },
      quantity: 1,
    },
  ],
  success_url: `${baseUrl}/manual/${analiseId}?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/resultado/${analiseId}`,
  metadata: {
    analise_id: analiseId,
    customer_name: analise.nome ?? "",
  },
  allow_promotion_codes: true,
};

    // ✅ Só manda customer_email se existir
    if (analise.email) sessionParams.customer_email = analise.email;

    const session = await stripe.checkout.sessions.create(sessionParams);

    const { error: upErr } = await supabase
      .from("analises")
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    if (upErr) {
      return NextResponse.json(
        { error: "Falha ao salvar session no Supabase", details: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("❌ Erro ao criar checkout:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar checkout",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}