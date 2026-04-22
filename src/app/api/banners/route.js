import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ banners });
}

export async function POST(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { title, tag, subtitle, cta, ctaHref, secondaryCta, secondaryHref, image, align, active } = body;
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const count = await prisma.banner.count();
  const banner = await prisma.banner.create({
    data: {
      title,
      tag: tag || '',
      subtitle: subtitle || '',
      cta: cta || 'Shop Now',
      ctaHref: ctaHref || '/products',
      secondaryCta: secondaryCta || 'View All',
      secondaryHref: secondaryHref || '/products',
      image: image || '',
      align: align || 'left',
      active: active !== false,
      order: count,
    },
  });
  return NextResponse.json({ banner }, { status: 201 });
}
