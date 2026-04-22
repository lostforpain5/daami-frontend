import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY || 'test_secret_key_placeholder';
const KHALTI_URL = 'https://a.khalti.com/api/v2/epayment/initiate/';

export async function POST(request) {
  const user = requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, amount, orderName } = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const payload = {
      return_url: `${appUrl}/checkout/payment-success?method=khalti&orderId=${orderId}`,
      website_url: appUrl,
      amount: Math.round(amount * 100),
      purchase_order_id: orderId,
      purchase_order_name: orderName || 'Daami Clothing Order',
      customer_info: { name: user.name, email: user.email },
    };

    const res = await fetch(KHALTI_URL, {
      method: 'POST',
      headers: { Authorization: `Key ${KHALTI_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) return NextResponse.json({ error: data.detail || 'Khalti initiation failed' }, { status: 400 });

    await prisma.payment.updateMany({
      where: { orderId },
      data: { method: 'Khalti', txnId: data.pidx },
    });

    return NextResponse.json({ paymentUrl: data.payment_url, pidx: data.pidx });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pidx = searchParams.get('pidx');
  const orderId = searchParams.get('purchase_order_id');

  try {
    const res = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: { Authorization: `Key ${KHALTI_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pidx }),
    });
    const data = await res.json();

    if (data.status === 'Completed') {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'Processing' } });
      await prisma.payment.updateMany({ where: { orderId }, data: { status: 'Completed' } });
    }

    return NextResponse.json({ status: data.status });
  } catch (e) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
