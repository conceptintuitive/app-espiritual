import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const analiseId = session.metadata.analiseId;

    console.log('Pagamento confirmado para análise:', analiseId);

    const { error } = await supabase
      .from('analises')
      .update({ comprou_manual: true })
      .eq('id', analiseId);

    if (error) {
      console.error('Erro ao atualizar banco:', error);
    } else {
      console.log('Manual desbloqueado automaticamente!');
    }
  }

  return NextResponse.json({ received: true });
}