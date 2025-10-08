import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { analiseId } = await request.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Manual Espiritual Completo',
            description: 'Seu guia personalizado de poderes ocultos com rituais, arquétipos e práticas exclusivas',
          },
          unit_amount: 4700, // R$ 47,00 em centavos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/manual/${analiseId}?sucesso=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/resultado/${analiseId}`,
      metadata: {
        analiseId: analiseId
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}