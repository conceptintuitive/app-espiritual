import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BONUS_TITULOS = {
  projecao12m: "Projeção de 12 Meses",
  humandesign: "Mapa de Human Design",
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

    // Único ponto do fluxo de pagamento onde a requisição vem direto do
    // navegador do cliente — o webhook (MP chamando nosso servidor) nunca
    // tem esse contexto, então guardamos aqui pra usar depois no evento
    // Purchase da Meta Conversions API (client_ip_address/client_user_agent).
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent") || null;

    const body = await request.json().catch(() => null);
    const analiseId = body?.analiseId;
    // bonusProdutos é o formato novo (subconjunto de ['projecao12m','humandesign']);
    // incluirTier2 continua funcionando como antes (todo-ou-nada, usado pelo
    // checkbox de bundle do /resultado) pra não quebrar quem já chama assim.
    const bonusProdutos = Array.isArray(body?.bonusProdutos)
      ? body.bonusProdutos.filter((p) => BONUS_TITULOS[p])
      : body?.incluirTier2
      ? ["projecao12m", "humandesign"]
      : [];
    const presenteEmail = String(body?.presenteEmail || "").trim();
    const presenteDe = String(body?.presenteDe || "").trim();
    if (presenteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(presenteEmail)) {
      return NextResponse.json({ error: "Email de presente inválido" }, { status: 400 });
    }

    if (!analiseId) {
      return NextResponse.json({ error: "ID da análise é obrigatório" }, { status: 400 });
    }

    const { data: analise, error: analiseError } = await supabase
      .from("analises")
      .select("id,nome,email,payment_status,created_at")
      .eq("id", analiseId)
      .single();

    if (analiseError || !analise) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    if (analise.payment_status === "paid") {
      return NextResponse.json({ error: "Esta análise já foi paga" }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    // Preço de lançamento (R$47) vale só nos 15min após a análise ser gerada
    // — depois disso cobra o valor cheio (R$97). Mesmo cálculo do countdown
    // exibido em /resultado, pra nunca cobrar diferente do que foi mostrado.
    const JANELA_LANCAMENTO_MS = 15 * 60 * 1000;
    const dentroDaJanela =
      analise.created_at && Date.now() - new Date(analise.created_at).getTime() <= JANELA_LANCAMENTO_MS;
    const precoManual = dentroDaJanela ? 47 : 97;

    const items = [
      {
        id: analiseId,
        title: "Manual Premium Personalizado",
        description: `Relatório personalizado completo para ${analise.nome ?? "você"}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: precoManual,
      },
    ];

    if (bonusProdutos.length > 0) {
      // R$50 é o preço combo (só quando os dois vêm juntos) — R$29,90 é o
      // preço de um bônus avulso adicionado ao manual, sem o desconto do combo.
      const preco = bonusProdutos.length === 2 ? 50 : 29.9;
      const titulo = bonusProdutos.map((p) => BONUS_TITULOS[p]).join(" + ");
      items.push({
        id: `${analiseId}-bonus-${bonusProdutos.join("-")}`,
        title: `${titulo} (bônus)`,
        description: `${titulo} para ${analise.nome ?? "você"}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: preco,
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
        // Propaga pro objeto de pagamento no webhook, pra saber quais bônus
        // esse checkout já incluía junto com o manual.
        metadata: {
          includes_tier2: bonusProdutos.includes("projecao12m"),
          includes_hd: bonusProdutos.includes("humandesign"),
        },
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    });

    // Salva o ID da preferência no Supabase, e os dados do presente (se houver)
    // — já ficam prontos pro webhook mandar o acesso pro destinatário certo.
    await supabase
      .from("analises")
      .update({
        mp_preference_id: result.id,
        updated_at: new Date().toISOString(),
        ...(presenteEmail && { presente_email: presenteEmail, presente_de: presenteDe || null }),
      })
      .eq("id", analiseId);

    // Melhor esforço, em update separado do crítico acima — se a coluna
    // ainda não existir (deploy antes da migração rodar), isso não pode
    // quebrar a criação do checkout. Sem isso salvo, o Purchase da Meta só
    // sai sem IP/user-agent, exatamente como já era antes desta mudança.
    const { error: trackingErr } = await supabase
      .from("analises")
      .update({ checkout_ip: clientIp, checkout_user_agent: userAgent })
      .eq("id", analiseId);
    if (trackingErr) {
      console.error("⚠️ Não foi possível salvar checkout_ip/checkout_user_agent (coluna existe?):", trackingErr.message);
    }

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
