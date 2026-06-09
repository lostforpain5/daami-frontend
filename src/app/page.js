import Link from 'next/link';
import SimpleCategories from '@/components/home/SimpleCategories';
import HomeProducts from '@/components/home/HomeProducts';

export default function HomePage() {
  return (
    <>
      {/* Compact hero — small, so products are visible right away */}
      <section className="bg-daami-black text-center px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">
          Trending Couple T-Shirts
        </h1>
        <p className="text-white/70 mt-2 max-w-md mx-auto text-sm">
          Pick a design and press <span className="text-daami-gold font-semibold">Buy Now</span> — no account needed.
        </p>
      </section>

      {/* Products first — customer can buy immediately */}
      <HomeProducts />

      {/* Browse by category */}
      <SimpleCategories />
    </>
  );
}
