import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

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
  emailNotifications: 'true',
  smsNotifications: 'false',
  maintenanceMode: 'false',
};

export async function GET(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rows = await prisma.setting.findMany();
  const settings = { ...DEFAULTS };
  rows.forEach(r => { settings[r.key] = r.value; });
  return NextResponse.json({ settings });
}

export async function PUT(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const updates = Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  );
  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
