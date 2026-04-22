import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const parse = (p) => ({
  ...p,
  images: JSON.parse(p.images || '[]'),
  sizes: JSON.parse(p.sizes || '[]'),
  colors: JSON.parse(p.colors || '[]'),
  tags: JSON.parse(p.tags || '[]'),
});

export async function GET(request, { params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } })
    || await prisma.product.findUnique({ where: { slug: id } });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product: parse(product) });
}

export async function PUT(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const body = await request.json();
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.category !== undefined) data.category = body.category;
    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.originalPrice !== undefined) data.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null;
    if (body.description !== undefined) data.description = body.description;
    if (body.images !== undefined) data.images = JSON.stringify(body.images);
    if (body.sizes !== undefined) data.sizes = JSON.stringify(body.sizes);
    if (body.colors !== undefined) data.colors = JSON.stringify(body.colors);
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    if (body.badge !== undefined) data.badge = body.badge;
    if (body.material !== undefined) data.material = body.material;
    if (body.care !== undefined) data.care = body.care;
    if (body.inStock !== undefined) data.inStock = body.inStock;
    if (body.featured !== undefined) data.featured = body.featured;

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ product: parse(product) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
