import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

const ESEWA_MERCHANT = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
const ESEWA_SECRET = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

function generateSignature(data, secret) {
  const str = `total_amount=${data.total_amount},transaction_uuid=${data.transaction_uuid},product_code=${data.product_code}`;
  return crypto.createHmac('sha256', secret).update(str).digest('base64');
}

export async function POST(request) {
  const user = requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, amount } = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const txnUuid = `${orderId}-${Date.now()}`;

    const formData = {
      amount: amount.toString(),
      tax_amount: '0',
      total_amount: amount.toString(),
      transaction_uuid: txnUuid,
      product_code: ESEWA_MERCHANT,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${appUrl}/checkout/payment-success?method=esewa&orderId=${orderId}`,
      failure_url: `${appUrl}/checkout/payment-failed?orderId=${orderId}`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: generateSignature({ total_amount: amount, transaction_uuid: txnUuid, product_code: ESEWA_MERCHANT }, ESEWA_SECRET),
    };

    await prisma.payment.updateMany({
      where: { orderId },
      data: { method: 'eSewa', txnId: txnUuid },
    });

    return NextResponse.json({ formData, paymentUrl: ESEWA_URL });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const encodedData = searchParams.get('data');
  const orderId = searchParams.get('orderId');

  try {
    if (encodedData) {
      const decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString());
      if (decoded.status === 'COMPLETE') {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'Processing' } });
        await prisma.payment.updateMany({ where: { orderId }, data: { status: 'Completed' } });
        return NextResponse.json({ status: 'Completed' });
      }
    }
    return NextResponse.json({ status: 'Failed' });
  } catch (e) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
