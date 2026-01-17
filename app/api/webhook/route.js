// app/api/webhook/stripe/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !webhookSecret) {
      console.error('❌ Webhook signature ou secret não configurados');
      return NextResponse.json(
        { error: 'Webhook não configurado' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('❌ Erro ao verificar webhook:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const analiseId = session.metadata.analise_id;

        if (!analiseId) {
          console.error('❌ analise_id não encontrado nos metadata');
          break;
        }

        console.log('✅ Pagamento aprovado:', session.id, 'Análise:', analiseId);

        // Atualizar status no Supabase
        const { error } = await supabase
          .from('analises')
          .update({
            payment_status: 'paid',
            stripe_payment_intent: session.payment_intent,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', analiseId);

        if (error) {
          console.error('❌ Erro ao atualizar status de pagamento:', error);
        } else {
          console.log('✅ Status atualizado para "paid"');
          
          // Aqui você pode adicionar:
          // - Envio de email com manual completo
          // - Notificação para o usuário
          // - Geração do PDF do manual
          // await enviarManualCompleto(analiseId);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('❌ Pagamento falhou:', paymentIntent.id);
        
        // Opcional: atualizar status para 'failed'
        break;
      }

      default:
        console.log(`ℹ️ Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}