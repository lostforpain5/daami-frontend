'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-daami-cream">
      <div className="page-container">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-daami-gold">Collections</span>
          <h2 className="section-title mt-2">Shop by Category</h2>
          <p className="section-subtitle mt-2">Find exactly what you're looking for</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`group relative overflow-hidden ${
                i === 0 ? 'col-span-2 md:col-span-1 lg:col-span-1' :
                i === 1 ? 'col-span-2 md:col-span-2 lg:col-span-1' :
                ''
              }`}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-daami-black">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-70"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-daami-gold/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <h3 className="text-white font-bold text-base md:text-lg tracking-wide">{cat.label}</h3>
                  {cat.description && (
                    <p className="text-white/60 text-[10px] md:text-xs mt-0.5 leading-relaxed hidden md:block">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-daami-gold text-xs font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Shop Now <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
