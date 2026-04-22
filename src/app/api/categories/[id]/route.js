import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const { label, description, image, bannerImage, order } = await request.json();
    const data = {};
    if (label !== undefined) data.label = label;
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (bannerImage !== undefined) data.bannerImage = bannerImage;
    if (order !== undefined) data.order = order;

    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ category });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
