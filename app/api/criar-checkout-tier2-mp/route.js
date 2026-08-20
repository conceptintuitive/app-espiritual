import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function POST(request) {
  try {
    const mpToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!mpToken) {
      return NextResponse.json({ error: "Missing MP_ACCESS_TOKEN" }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: mpToken });
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const body = await request.json().catch(() => null);
    const analiseId = body?.analiseId;

    if (!analiseId) {
      return NextResponse.json({ error: "ID da análise é obrigatório" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,nome,email,payment_status,tier2_payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    if (analise.payment_status !== "paid") {
      return NextResponse.json(
        { error: "É preciso comprar o manual completo antes de desbloquear a Projeção de 12 Meses" },
        { status: 400 }
      );
    }

    if (analise.tier2_payment_status === "paid") {
      return NextResponse.json({ error: "A Projeção de 12 Meses já foi paga" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `${analiseId}-tier2`,
            title: "Projeção de 12 Meses — Upsell",
            description: `Projeção numerológica mês a mês para ${analise.nome ?? "você"}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: 97,
          },
        ],
        payer: {
          email: analise.email || undefined,
        },
        back_urls: {
          success: `${baseUrl}/manual/${analiseId}`,
          failure: `${baseUrl}/manual/${analiseId}`,
          pending: `${baseUrl}/manual/${analiseId}`,
        },
        auto_return: "approved",
        // Sufixo "__tier2" distingue esse pagamento do manual base no webhook,
        // que usa o mesmo external_reference pattern pra ambos os produtos.
        external_reference: `${analiseId}__tier2`,
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    });

    await supabase
      .from("analises")
      .update({
        tier2_mp_preference_id: result.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    return NextResponse.json({
      success: true,
      url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Erro Mercado Pago (tier2):", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout do tier 2", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
