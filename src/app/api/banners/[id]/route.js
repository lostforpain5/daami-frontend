import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const data = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.tag !== undefined) data.tag = body.tag;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle;
  if (body.cta !== undefined) data.cta = body.cta;
  if (body.ctaHref !== undefined) data.ctaHref = body.ctaHref;
  if (body.secondaryCta !== undefined) data.secondaryCta = body.secondaryCta;
  if (body.secondaryHref !== undefined) data.secondaryHref = body.secondaryHref;
  if (body.image !== undefined) data.image = body.image;
  if (body.align !== undefined) data.align = body.align;
  if (body.active !== undefined) data.active = body.active;
  if (body.order !== undefined) data.order = body.order;

  const banner = await prisma.banner.update({ where: { id }, data });
  return NextResponse.json({ banner });
}

export async function DELETE(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
