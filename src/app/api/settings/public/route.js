import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  storeName: 'Daami Clothing',
  storeEmail: 'hello@daamiclothing.com',
  storePhone: '+977 980-0000000',
  storeAddress: 'New Road, Kathmandu, Nepal',
  freeShippingThreshold: '2500',
  shippingFee: '150',
  khaltiEnabled: 'true',
  esewaEnabled: 'true',
  stripeEnabled: 'true',
  codEnabled: 'true',
  maintenanceMode: 'false',
  paymentQrCode: '',
};

const PUBLIC_KEYS = Object.keys(DEFAULTS);

export async function GET() {
  const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  const settings = { ...DEFAULTS };
  rows.forEach(r => { settings[r.key] = r.value; });
  return NextResponse.json({ settings });
}
