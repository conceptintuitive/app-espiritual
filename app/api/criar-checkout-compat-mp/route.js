import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PRECO = 29.9;

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
    const pessoa2Nome = String(body?.pessoa2Nome || "").trim();
    const pessoa2DataNascimento = String(body?.pessoa2DataNascimento || "").trim();

    if (!analiseId) {
      return NextResponse.json({ error: "ID da análise é obrigatório" }, { status: 400 });
    }
    if (!pessoa2Nome || !pessoa2DataNascimento) {
      return NextResponse.json(
        { error: "Nome e data de nascimento da segunda pessoa são obrigatórios" },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pessoa2DataNascimento)) {
      return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,nome,email,compat_payment_status")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    if (analise.compat_payment_status === "paid") {
      return NextResponse.json({ error: "A Compatibilidade Completa já foi paga" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `${analiseId}-compat`,
            title: "Compatibilidade Completa",
            description: `Compatibilidade entre ${analise.nome ?? "você"} e ${pessoa2Nome}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: PRECO,
          },
        ],
        payer: {
          email: analise.email || undefined,
        },
        back_urls: {
          success: `${baseUrl}/compatibilidade-completa/${analiseId}`,
          failure: `${baseUrl}/compatibilidade-completa/${analiseId}`,
          pending: `${baseUrl}/compatibilidade-completa/${analiseId}`,
        },
        auto_return: "approved",
        external_reference: `${analiseId}__compat`,
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    });

    // Salva os dados da segunda pessoa junto — já ficam prontos pro cálculo
    // assim que o pagamento for aprovado.
    await supabase
      .from("analises")
      .update({
        compat_mp_preference_id: result.id,
        compat_pessoa2_nome: pessoa2Nome,
        compat_pessoa2_data_nascimento: pessoa2DataNascimento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);

    return NextResponse.json({
      success: true,
      url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Erro Mercado Pago (compatibilidade):", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout da compatibilidade", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
