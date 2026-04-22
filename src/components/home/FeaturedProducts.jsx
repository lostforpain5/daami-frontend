'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

const tabs = [
  { label: 'Featured', filter: (p) => p.featured },
  { label: 'New Arrivals', filter: (p) => p.tags.includes('new-arrivals') },
  { label: 'Trending', filter: (p) => p.tags.includes('trending') },
  { label: 'Sale', filter: (p) => p.badge === 'Sale' },
];

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        const list = (data.products || []).map(p => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
          sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
          colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
          tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
        }));
        setProducts(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayed = products.filter(tabs[activeTab].filter).slice(0, 8);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-daami-gold">Curated For You</span>
            <h2 className="section-title mt-2">Our Products</h2>
          </div>
          <Link href="/products" className="flex items-center gap-2 text-sm font-medium text-daami-black hover:text-daami-gold transition-colors group shrink-0">
            View All Products <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex items-center gap-1 mb-8 border-b border-gray-100 overflow-x-auto pb-0 scrollbar-none">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-200 ${
                activeTab === i
                  ? 'border-daami-gold text-daami-gold'
                  : 'border-transparent text-daami-gray hover:text-daami-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayed.length > 0 ? (
              displayed.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center text-daami-gray py-12">No products found in this category.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
