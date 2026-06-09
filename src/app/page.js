import Link from 'next/link';
import SimpleCategories from '@/components/home/SimpleCategories';
import HomeProducts from '@/components/home/HomeProducts';

export default function HomePage() {
  return (
    <>
      {/* Simple, clean hero — no slider, no clutter */}
      <section className="bg-daami-black text-center px-4 py-16 md:py-24">
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Daami Clothing
        </h1>
        <p className="text-white/70 mt-4 max-w-md mx-auto text-sm md:text-base">
          Premium couple &amp; matching t-shirts. Order online in just a few taps —
          no account needed.
        </p>
        <Link
          href="/category/couple-tshirt"
          className="inline-block mt-7 bg-daami-gold text-daami-black font-bold text-sm md:text-base px-8 py-3.5 rounded-full hover:bg-white transition-colors"
        >
          Shop Now
        </Link>
      </section>

      <SimpleCategories />
      <HomeProducts />
    </>
  );
}
