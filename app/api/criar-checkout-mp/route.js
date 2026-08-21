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
    const incluirTier2 = Boolean(body?.incluirTier2);

    if (!analiseId) {
      return NextResponse.json({ error: "ID da análise é obrigatório" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,nome,email,payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    if (analise.payment_status === "paid") {
      return NextResponse.json({ error: "Esta análise já foi paga" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    const items = [
      {
        id: analiseId,
        title: "Manual Premium Personalizado",
        description: `Relatório personalizado completo para ${analise.nome ?? "você"}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: 47,
      },
    ];

    if (incluirTier2) {
      items.push({
        id: `${analiseId}-tier2`,
        title: "Projeção de 12 Meses + Mapa de Human Design (bônus)",
        description: `Projeção numerológica mês a mês e Mapa de Human Design para ${analise.nome ?? "você"} — preço combo dos dois bônus`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: 50,
      });
    }

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer: {
          email: analise.email || undefined,
        },
        back_urls: {
          success: `${baseUrl}/manual/${analiseId}`,
          failure: `${baseUrl}/resultado/${analiseId}`,
          pending: `${baseUrl}/resultado/${analiseId}?pending=true`,
        },
        auto_return: "approved",
        external_reference: analiseId,
        // Propaga pro objeto de pagamento no webhook, pra saber se esse
        // checkout já incluía os bônus (Projeção de 12 Meses + Human Design,
        // R$50 combo) junto — o mesmo preço do combo comprado avulso depois.
        metadata: { includes_tier2: incluirTier2, includes_hd: incluirTier2 },
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    });

    // Salva o ID da preferência no Supabase
    await supabase
      .from("analises")
      .update({
        mp_preference_id: result.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    return NextResponse.json({
      success: true,
      url: result.init_point,         // URL de produção
      sandbox_url: result.sandbox_init_point, // URL de teste
    });
  } catch (error) {
    console.error("❌ Erro Mercado Pago:", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout MP", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
