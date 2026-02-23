// app/api/webhook/stripe/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig || !webhookSecret) {
      console.error("❌ Webhook signature ou secret não configurados");
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("❌ Erro ao verificar webhook:", err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // trava extra: só continua se estiver pago
        if (session.payment_status !== "paid") {
          console.log(
            "ℹ️ checkout.session.completed mas não paid:",
            session.id,
            session.payment_status
          );
          break;
        }

        const analiseId = session.metadata?.analise_id;
        if (!analiseId) {
          console.error("❌ analise_id não encontrado nos metadata");
          break;
        }

        const email = session.customer_details?.email || session.customer_email;
        if (!email) {
          console.error("❌ Email do cliente não encontrado na session:", session.id);
          break;
        }

        console.log("✅ Pagamento aprovado:", session.id, "Análise:", analiseId, "Email:", email);

        // Atualizar status no Supabase
        const { error } = await supabase
          .from("analises")
          .update({
            payment_status: "paid",
            stripe_payment_intent: session.payment_intent,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", analiseId);

        if (error) {
          console.error("❌ Erro ao atualizar status de pagamento:", error);
          break;
        }

        console.log('✅ Status atualizado para "paid"');

        // Enviar email chamando sua rota /api/send
        const sendRes = await fetch("https://intuitiveconcept.com.br/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            manualId: analiseId,
          }),
        });

        const sendBody = await sendRes.json().catch(() => ({}));

        if (!sendRes.ok) {
          console.error("❌ Falha ao enviar email:", sendRes.status, sendBody);
        } else {
          console.log("✅ Email enviado com sucesso:", sendBody);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.error("❌ Pagamento falhou:", paymentIntent.id);
        break;
      }

      default:
        console.log(`ℹ️ Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro geral no webhook:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}