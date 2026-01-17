// app/api/criar-checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // 🔥 força Node (evita erro com Stripe no Edge)

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function getBaseUrl() {
  // Prioriza o que você controla
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  // Fallback seguro no Vercel
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return null;
}

export async function POST(request) {
  try {
    const { analiseId } = await request.json();

    if (!analiseId) {
      return NextResponse.json({ error: "ID da análise é obrigatório" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,nome,email,payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json(
        { error: "Análise não encontrada", details: analiseError?.message },
        { status: 404 }
      );
    }

    if (analise.payment_status === "paid") {
      return NextResponse.json({ error: "Esta análise já foi paga" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base URL não configurada", details: "Defina NEXT_PUBLIC_BASE_URL na Vercel." },
        { status: 500 }
      );
    }

    const sessionParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Manual Completo - Seu Mapa de Poder",
              description: `Relatório personalizado completo para ${analise.nome ?? "você"}`,
            },
            unit_amount: 1990,
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

    // ✅ Só manda customer_email se existir (evita erro Stripe)
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

    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("❌ Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
