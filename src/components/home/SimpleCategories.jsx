'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

// Big, beginner-friendly category cards — one click to each collection.
const CATEGORIES = [
  {
    label: 'Boy Tshirt',
    href: '/category/boy-tshirt',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop',
  },
  {
    label: 'Girl Tshirt',
    href: '/category/girl-tshirt',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=1000&fit=crop',
  },
  {
    label: 'Couple Tshirt',
    href: '/category/couple-tshirt',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop',
  },
];

export default function SimpleCategories() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="page-container">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle mt-2">Tap a collection to start shopping</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative block overflow-hidden rounded-lg"
            >
              <div className="relative aspect-[4/5] bg-daami-black">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-75"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-center">
                  <h3 className="text-white font-bold text-xl md:text-2xl tracking-wide">{cat.label}</h3>
                  <span className="inline-flex items-center gap-2 mt-3 bg-daami-gold text-daami-black text-sm font-semibold px-5 py-2.5 rounded-full group-hover:bg-white transition-colors">
                    Shop Now <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
