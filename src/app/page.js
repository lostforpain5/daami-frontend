import HeroSection from '@/components/home/HeroSection';
import SimpleCategories from '@/components/home/SimpleCategories';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import PromoSection from '@/components/home/PromoSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SimpleCategories />
      <FeaturedProducts />
      <PromoSection />
    </>
  );
}
