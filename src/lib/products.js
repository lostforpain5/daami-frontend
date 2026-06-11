import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

// Normalize a DB row so JSON-string columns become real arrays.
export const parseProduct = (p) => ({
  ...p,
  images: JSON.parse(p.images || '[]'),
  sizes: JSON.parse(p.sizes || '[]'),
  colors: JSON.parse(p.colors || '[]'),
  tags: JSON.parse(p.tags || '[]'),
});

// Cached full product list — one Neon query per `revalidate` window instead of
// per request. Invalidated instantly by revalidateTag('products') on admin writes.
export const getAllProducts = unstable_cache(
  async () => {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(parseProduct);
  },
  ['all-products'],
  { revalidate: 120, tags: ['products'] },
);

// Trending carousel = exactly the products the admin tags "trending" (newest first).
// No fallback — the admin has full control from /admin/trending.
export const selectTrending = (list) =>
  list.filter((p) => p.tags.includes('trending')).slice(0, 12);
