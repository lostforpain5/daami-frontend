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

export default function HomeProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts((data.products || []).map(parse)))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-daami-cream">
      <div className="page-container">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="section-title">Our T-Shirts</h2>
          <p className="section-subtitle mt-2">Tap any item, then press Buy Now to order</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-200 animate-pulse aspect-[3/4]" />)}
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
