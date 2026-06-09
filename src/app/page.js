import TrendingCarousel from '@/components/home/TrendingCarousel';
import SimpleCategories from '@/components/home/SimpleCategories';
import HomeProducts from '@/components/home/HomeProducts';

export default function HomePage() {
  return (
    <>
      {/* Trending Couple T-Shirts — PlayStation-style product card carousel (top section on open) */}
      <TrendingCarousel />

      {/* All products — buy directly */}
      <HomeProducts />

      {/* Browse by category */}
      <SimpleCategories />
    </>
  );
}
