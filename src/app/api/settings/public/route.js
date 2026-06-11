import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
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

// Settings change rarely — cache for 5 min (invalidate with revalidateTag('settings')).
const getPublicSettings = unstable_cache(
  async () => {
    const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
    const settings = { ...DEFAULTS };
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  },
  ['public-settings'],
  { revalidate: 300, tags: ['settings'] },
);

export async function GET() {
  const settings = await getPublicSettings();
  return NextResponse.json(
    { settings },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
