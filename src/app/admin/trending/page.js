'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { TrendingUp, Check, Plus, Search } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

const isTrending = (p) => p.tags.includes('trending');

export default function AdminTrendingPage() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/products');
      const data = await res.json();
      setProducts((data.products || []).map(parse));
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (p) => {
    const turningOn = !isTrending(p);
    const nextTags = turningOn ? [...p.tags, 'trending'] : p.tags.filter((t) => t !== 'trending');
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, tags: nextTags } : x))); // optimistic
    setSavingId(p.id);
    try {
      const res = await authFetch(`/api/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ tags: nextTags }),
      });
      if (!res.ok) throw new Error();
      toast.success(turningOn ? 'Added to Trending carousel' : 'Removed from Trending');
    } catch {
      toast.error('Failed to update');
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, tags: p.tags } : x))); // revert
    } finally {
      setSavingId(null);
    }
  };

  const selected = products.filter(isTrending);
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-daami-black flex items-center gap-2">
            <TrendingUp size={22} className="text-daami-gold" /> Trending Carousel
          </h1>
          <p className="text-sm text-daami-gray mt-1">
            Choose which product photos show in the homepage <span className="font-semibold">Trending</span> slider.
            Tap a product to add or remove it. The carousel shows up to 12, newest first.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full bg-daami-gold/15 text-daami-gold border border-daami-gold/30">
          {selected.length} in carousel
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-daami-gray" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-daami-gold bg-white"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-daami-gray py-16">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => {
            const on = isTrending(p);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
                disabled={savingId === p.id}
                className={`group relative text-left rounded-xl overflow-hidden border-2 transition-all bg-white disabled:opacity-60 ${
                  on ? 'border-daami-gold shadow-md' : 'border-gray-200 hover:border-daami-gold/50'
                }`}
              >
                <div className="relative aspect-[3/4] bg-daami-cream">
                  {p.images[0] && (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 20vw" />
                  )}
                  {/* Status badge */}
                  <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    on ? 'bg-daami-gold text-daami-black' : 'bg-black/55 text-white'
                  }`}>
                    {on ? <><Check size={11} /> In Carousel</> : <><Plus size={11} /> Add</>}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-daami-gray capitalize truncate">{p.category}</p>
                  <h3 className="text-sm font-semibold text-daami-black leading-snug line-clamp-1">{p.name}</h3>
                  <p className="text-sm font-bold text-daami-black mt-0.5">{formatPrice(p.price)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
