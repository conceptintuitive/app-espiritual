import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Cada upsell custa R$29,90 avulso, ou R$50 os dois juntos (economia de
// R$9,80) — preço combo definido explicitamente, não é soma dos avulsos.
const PRECO_AVULSO = 29.9;
const PRECO_COMBO = 50;

const PRODUTOS = {
  projecao12m: {
    titulo: "Projeção de 12 Meses",
    statusCol: "tier2_payment_status",
    paymentIdCol: "tier2_mp_payment_id",
    preferenceIdCol: "tier2_mp_preference_id",
  },
  humandesign: {
    titulo: "Mapa de Human Design",
    statusCol: "hd_payment_status",
    paymentIdCol: "hd_mp_payment_id",
    preferenceIdCol: "hd_mp_preference_id",
  },
};

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
    const produtos = Array.isArray(body?.produtos)
      ? body.produtos.filter((p) => PRODUTOS[p])
      : [];

    if (!analiseId) {
      return NextResponse.json({ error: "ID da análise é obrigatório" }, { status: 400 });
    }
    if (produtos.length === 0) {
      return NextResponse.json({ error: "Nenhum produto válido selecionado" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,nome,email,payment_status,tier2_payment_status,hd_payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    // Não exige mais o manual base pago — esses bônus também podem ser
    // comprados avulsos, direto do /resultado, sem o manual completo.
    const jaPago = produtos.filter((p) => analise[PRODUTOS[p].statusCol] === "paid");
    if (jaPago.length > 0) {
      return NextResponse.json(
        { error: `Já pago: ${jaPago.map((p) => PRODUTOS[p].titulo).join(", ")}` },
        { status: 400 }
      );
    }

    const preco = produtos.length === 2 ? PRECO_COMBO : PRECO_AVULSO;
    const titulo = produtos.map((p) => PRODUTOS[p].titulo).join(" + ");
    const baseUrl = getBaseUrl();

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `${analiseId}-upsell-${produtos.join("-")}`,
            title: `${titulo} — Upsell`,
            description: `${titulo} para ${analise.nome ?? "você"}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: preco,
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
        external_reference: `${analiseId}__upsell`,
        metadata: {
          inclui_projecao12m: produtos.includes("projecao12m"),
          inclui_humandesign: produtos.includes("humandesign"),
        },
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    });

    const updates = { updated_at: new Date().toISOString() };
    produtos.forEach((p) => {
      updates[PRODUTOS[p].preferenceIdCol] = result.id;
    });
    await supabase.from("analises").update(updates).eq("id", analiseId);

    return NextResponse.json({
      success: true,
      url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Erro Mercado Pago (upsell):", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout do upsell", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
