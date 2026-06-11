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

// Couple-tee selector (shared by the homepage server render + carousel fallback).
export const isCouple = (p) =>
  p.category === 'couple-tshirts' || /couple/i.test(p.category || '') || p.tags.includes('couple');

export const selectTrendingCouple = (list) => {
  const couple = list.filter(isCouple);
  const trendingCouple = couple.filter((p) => p.tags.includes('trending'));
  let picked =
    trendingCouple.length >= 3 ? trendingCouple :
    couple.length >= 3 ? couple :
    list.filter((p) => p.tags.includes('trending'));
  if (picked.length < 3) picked = list;
  return picked.slice(0, 12);
};
