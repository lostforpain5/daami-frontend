import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const { orderId } = event.data.object.metadata;
    if (orderId) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'Processing' } });
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: 'Completed', txnId: event.data.object.id },
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const { orderId } = event.data.object.metadata;
    if (orderId) {
      await prisma.payment.updateMany({ where: { orderId }, data: { status: 'Failed' } });
    }
  }

  return NextResponse.json({ received: true });
}
