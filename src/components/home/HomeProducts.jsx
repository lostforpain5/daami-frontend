'use client';
import { useState, useEffect } from 'react';
import ProductCard from '@/components/products/ProductCard';

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

export default function HomeProducts({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    if (initialProducts) return; // server already provided the data
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts((data.products || []).map(parse)))
      .finally(() => setLoading(false));
  }, [initialProducts]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-transparent">
      <div className="page-container">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-white/5 animate-pulse aspect-[3/4] rounded-[24px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
