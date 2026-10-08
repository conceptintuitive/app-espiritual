import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { getPrecoManual, PRECO_BONUS_AVULSO, PRECO_BONUS_COMBO } from "@/lib/preco";
import { emailValido } from "@/lib/emailValidacao";

export const runtime = "nodejs";

// Nomes que aparecem no checkout do MP — alinhados com o que a pessoa já viu
// nas páginas públicas (/previsao-do-ano, /human-design), não com o nome
// interno antigo ("Projeção de 12 Meses"/"Mapa de Human Design").
const BONUS_TITULOS = {
  projecao12m: "Previsão do Ano",
  humandesign: "Human Design",
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
    if (presenteEmail && !emailValido(presenteEmail)) {
      return NextResponse.json({ error: "Email de presente inválido" }, { status: 400 });
    }
    const emailCorrigido = String(body?.emailCorrigido || "").trim();
    if (emailCorrigido && !emailValido(emailCorrigido)) {
      return NextResponse.json({ error: "email_invalido", mensagem: "Esse e-mail também não parece válido. Confira e tente de novo." }, { status: 400 });
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

    // E-mail salvo pode ter passado pela validação fraca de antes desta
    // mudança — sem checar aqui, a criação da preference falhava lá na
    // frente (API do MP rejeita e-mail malformado) sem explicar o motivo
    // real pra quem clicou em comprar. Com emailCorrigido, atualiza o
    // cadastro e segue com o checkout na mesma chamada, sem refazer o quiz.
    let emailPagador = analise.email;
    if (emailCorrigido) {
      emailPagador = emailCorrigido;
      const { error: emailUpdateError } = await supabase
        .from("analises")
        .update({ email: emailCorrigido, updated_at: new Date().toISOString() })
        .eq("id", analiseId);
      if (emailUpdateError) {
        console.error("Erro ao atualizar e-mail da análise:", emailUpdateError);
        return NextResponse.json({ error: "Erro ao atualizar e-mail" }, { status: 500 });
      }
    } else if (!emailValido(analise.email)) {
      return NextResponse.json({
        error: "email_invalido",
        mensagem: `O e-mail salvo (${analise.email || "em branco"}) parece inválido. Confirme ou corrija abaixo pra continuar.`,
        emailAtual: analise.email || "",
      }, { status: 400 });
    }

    const baseUrl = getBaseUrl();

    // Preço de lançamento (R$27) vale só nas 24h após a análise ser gerada
    // ("só hoje") — depois disso cobra o valor padrão (R$47). lib/preco.js
    // é a fonte única dessa regra — mesmo cálculo do countdown exibido em
    // /resultado, pra nunca cobrar diferente do que foi mostrado.
    const precoManual = getPrecoManual(analise.created_at);

    const items = [
      {
        id: analiseId,
        title: "Manual Completo — Intuitive Concept",
        description: `Relatório personalizado completo para ${analise.nome ?? "você"}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: precoManual,
      },
    ];

    if (bonusProdutos.length > 0) {
      // PRECO_BONUS_COMBO só quando os dois vêm juntos; PRECO_BONUS_AVULSO
      // pra um bônus só, adicionado ao manual.
      const preco = bonusProdutos.length === 2 ? PRECO_BONUS_COMBO : PRECO_BONUS_AVULSO;
      const titulo = bonusProdutos.map((p) => BONUS_TITULOS[p]).join(" + ");
      items.push({
        id: `${analiseId}-bonus-${bonusProdutos.join("-")}`,
        title: `${titulo} — Intuitive Concept`,
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
          email: emailPagador || undefined,
        },
        back_urls: {
          success: `${baseUrl}/manual/${analiseId}`,
          failure: `${baseUrl}/resultado/${analiseId}?pagamento=recusado`,
          pending: `${baseUrl}/resultado/${analiseId}?pending=true`,
        },
        auto_return: "approved",
        // Explícito em vez de depender só da configuração do app no painel do
        // MP — se aquela config estiver errada/desatualizada, o pagamento
        // pode ser aprovado no MP sem a gente nunca ficar sabendo.
        notification_url: `${baseUrl}/api/webhook-mp`,
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
