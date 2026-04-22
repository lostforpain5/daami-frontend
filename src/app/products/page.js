'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { categories } from '@/data/products';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Top Rated', value: 'rating' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCats, setSelectedCats] = useState([]);
  const [sort, setSort] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        setAllProducts(list);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const toggleCat = (slug) => {
    setSelectedCats(prev =>
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    );
  };

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (selectedCats.length > 0) {
      list = list.filter(p =>
        selectedCats.includes(p.category) ||
        p.tags.some(t => selectedCats.includes(t))
      );
    }
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sort) {
      case 'price-asc': return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...list].sort((a, b) => b.price - a.price);
      case 'newest': return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'rating': return [...list].sort((a, b) => b.rating - a.rating);
      default: return [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [allProducts, query, selectedCats, sort, priceRange]);

  const allCategoryOptions = [
    ...categories,
    { slug: 'new-arrivals', label: 'New Arrivals' },
  ];
  const uniqueCats = allCategoryOptions.filter((c, i, arr) => arr.findIndex(x => x.slug === c.slug) === i);

  return (
    <div className="page-container py-10 md:py-14">
      <div className="mb-8">
        <h1 className="section-title">{query ? `Search: "${query}"` : 'All Products'}</h1>
        <p className="section-subtitle">{loadingProducts ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters — Desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-7">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-daami-black mb-3">Categories</h3>
              <div className="space-y-2">
                {uniqueCats.map(cat => (
                  <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(cat.slug)}
                      onChange={() => toggleCat(cat.slug)}
                      className="accent-daami-gold"
                    />
                    <span className="text-sm text-daami-dark-gray group-hover:text-daami-gold transition-colors">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-daami-black mb-3">Price Range</h3>
              <div className="space-y-2">
                <input
                  type="range" min={0} max={10000} step={100}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-daami-gold"
                />
                <div className="flex justify-between text-xs text-daami-gray">
                  <span>Rs. 0</span>
                  <span>Rs. {priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
            {(selectedCats.length > 0 || priceRange[1] < 10000) && (
              <button
                onClick={() => { setSelectedCats([]); setPriceRange([0, 10000]); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <X size={12} /> Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2 hover:border-daami-gold hover:text-daami-gold transition-colors"
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-daami-gray hidden sm:block">Sort by:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="appearance-none border border-gray-200 px-4 py-2 pr-8 text-sm focus:outline-none focus:border-daami-gold bg-white cursor-pointer"
                >
                  {sortOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-daami-gray" />
              </div>
            </div>
          </div>

          {filtersOpen && (
            <div className="lg:hidden bg-daami-cream p-5 mb-6 border border-gray-200 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Filters</h3>
                <button onClick={() => setFiltersOpen(false)}><X size={18} /></button>
              </div>
              <div className="space-y-2">
                {uniqueCats.map(cat => (
                  <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedCats.includes(cat.slug)} onChange={() => toggleCat(cat.slug)} className="accent-daami-gold" />
                    <span className="text-sm">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-daami-gray text-lg">No products found.</p>
              <button onClick={() => { setSelectedCats([]); setPriceRange([0, 10000]); }} className="btn-primary mt-4">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="page-container py-20 text-center text-daami-gray">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
