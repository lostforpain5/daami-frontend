import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getAllProducts, parseProduct as parse } from '@/lib/products';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const featured = searchParams.get('featured');
  const limit = parseInt(searchParams.get('limit') || '0', 10);

  // Single cached Neon read; all filtering happens in memory on the cached list.
  let products = await getAllProducts();

  if (category) products = products.filter(p => p.category === category);
  if (featured === 'true') products = products.filter(p => p.featured);
  if (tag) products = products.filter(p => p.tags.includes(tag));
  if (q) {
    const lower = q.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
    );
  }
  if (limit > 0) products = products.slice(0, limit);

  return NextResponse.json(
    { products },
    { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } },
  );
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

    revalidateTag('products'); // refresh the cached product list immediately
    return NextResponse.json({ product: parse(product) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
