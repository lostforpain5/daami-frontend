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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const featured = searchParams.get('featured');

  const where = {};
  if (category) where.category = category;
  if (featured === 'true') where.featured = true;

  let products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  if (tag) products = products.filter(p => JSON.parse(p.tags || '[]').includes(tag));
  if (q) {
    const lower = q.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
    );
  }

  return NextResponse.json({ products: products.map(parse) });
}

export async function POST(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { name, category, price, originalPrice, description, images, sizes, colors, tags, badge, material, care, inStock, featured } = body;

    if (!name || !category || !price)
      return NextResponse.json({ error: 'Name, category and price are required' }, { status: 400 });

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    const product = await prisma.product.create({
      data: {
        name, slug, category,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        description: description || '',
        images: JSON.stringify(images || []),
        sizes: JSON.stringify(sizes || []),
        colors: JSON.stringify(colors || []),
        tags: JSON.stringify(tags || []),
        badge: badge || null,
        material: material || null,
        care: care || null,
        inStock: inStock !== false,
        featured: featured === true,
      },
    });

    return NextResponse.json({ product: parse(product) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
