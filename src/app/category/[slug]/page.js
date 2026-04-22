'use client';
import { use, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
];

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

export default function CategoryPage({ params }) {
  const { slug } = use(params);

  const [meta, setMeta] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        const found = (data.categories || []).find(c => c.slug === slug);
        setMeta(found || null);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    const param = slug === 'new-arrivals' ? 'tag=new-arrivals' :
                  slug === 'trending'     ? 'tag=trending' :
                  `category=${slug}`;
    fetch(`/api/products?${param}`)
      .then(r => r.json())
      .then(data => setAllProducts((data.products || []).map(parse)))
      .finally(() => setLoading(false));
  }, [slug]);

  const sorted = useMemo(() => {
    const list = [...allProducts];
    switch (sort) {
      case 'price-asc': return list.sort((a, b) => a.price - b.price);
      case 'price-desc': return list.sort((a, b) => b.price - a.price);
      case 'rating': return list.sort((a, b) => b.rating - a.rating);
      case 'newest': return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default: return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [allProducts, sort]);

  const categoryImage = meta?.bannerImage || meta?.image || '';
  const categoryLabel = meta?.label || slug.replace(/-/g, ' ');
  const categoryDesc = meta?.description || '';

  return (
    <div className="bg-white">
      <div className="relative h-48 md:h-64 bg-daami-black overflow-hidden">
        {categoryImage && (
          <Image
            src={categoryImage}
            alt={categoryLabel}
            fill
            className="object-cover opacity-50"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-daami-black/70 to-transparent" />
        <div className="relative z-10 h-full page-container flex flex-col justify-center">
          <p className="text-daami-gold text-xs font-semibold tracking-[0.3em] uppercase mb-2">Collection</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white capitalize">{categoryLabel}</h1>
          {categoryDesc && <p className="text-white/60 mt-2 text-sm">{categoryDesc}</p>}
        </div>
      </div>

      <div className="page-container py-10 md:py-14">
        <div className="flex items-center justify-between mb-7">
          <p className="text-sm text-daami-gray">
            {loading ? 'Loading...' : `${sorted.length} product${sorted.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-daami-gray">Sort:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none border border-gray-200 px-4 py-2 pr-8 text-sm focus:outline-none focus:border-daami-gold bg-white cursor-pointer"
              >
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-daami-gray" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-daami-gray text-lg">No products found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sorted.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
