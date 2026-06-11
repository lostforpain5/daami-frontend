import TrendingCarousel from '@/components/home/TrendingCarousel';
import SimpleCategories from '@/components/home/SimpleCategories';
import HomeProducts from '@/components/home/HomeProducts';
import { getAllProducts, selectTrendingCouple } from '@/lib/products';

// Statically rendered + revalidated every 2 min (ISR). Product data is fetched
// once on the server and passed down — no client fetch on first paint.
export const revalidate = 120;

export default async function HomePage() {
  const products = await getAllProducts();
  const trending = selectTrendingCouple(products);

  return (
    <>
      {/* Trending Couple T-Shirts — PlayStation-style coverflow */}
      <TrendingCarousel initialItems={trending} />

      {/* All products — buy directly */}
      <HomeProducts initialProducts={products} />

      {/* Browse by category */}
      <SimpleCategories />
    </>
  );
}
