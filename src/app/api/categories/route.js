import { NextResponse } from 'next/server';
import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const getCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { order: 'asc' } }),
  ['categories'],
  { revalidate: 300, tags: ['categories'] },
);

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(
    { categories },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}

export async function POST(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { slug, label, description, image, bannerImage, order } = await request.json();
    if (!slug || !label) return NextResponse.json({ error: 'Slug and label are required' }, { status: 400 });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });

    const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
    const category = await prisma.category.create({
      data: {
        slug,
        label,
        description: description || '',
        image: image || '',
        bannerImage: bannerImage || '',
        order: order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
    revalidateTag('categories');
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
