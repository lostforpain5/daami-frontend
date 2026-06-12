'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { TrendingUp, Check, Plus, Search, Trash2, Upload, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

const isTrending = (p) => p.tags.includes('trending');
const EMPTY = { front: '', back: '', name: '', category: '', price: '', originalPrice: '' };

export default function AdminTrendingPage() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(null); // 'front' | 'back' | null
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([authFetch('/api/products'), fetch('/api/categories')]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setProducts((pData.products || []).map(parse));
      setCategories(cData.categories || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  // Toggle an existing product in/out of the carousel.
  const toggle = async (p) => {
    const turningOn = !isTrending(p);
    const nextTags = turningOn ? [...p.tags, 'trending'] : p.tags.filter((t) => t !== 'trending');
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, tags: nextTags } : x)));
    setSavingId(p.id);
    try {
      const res = await authFetch(`/api/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ tags: nextTags }) });
      if (!res.ok) throw new Error();
      toast.success(turningOn ? 'Added to carousel' : 'Removed from carousel');
    } catch {
      toast.error('Failed to update');
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, tags: p.tags } : x)));
    } finally {
      setSavingId(null);
    }
  };

  // Upload a slide image.
  const handleUpload = (slot) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(slot);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('daami_token')}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setForm((f) => ({ ...f, [slot]: data.url }));
      toast.success(`${slot === 'front' ? 'Front' : 'Back'} photo uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Create a new slide (a product, auto-tagged "trending").
  const handleSave = async () => {
    if (!form.front) return toast.error('Please upload the front photo');
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price) return toast.error('Price is required');
    const category = form.category || categories[0]?.slug;
    if (!category) return toast.error('Add a category first (Categories tab)');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        description: form.name.trim(),
        images: [form.front, form.back].filter(Boolean), // front first, back second
        sizes: ['Freesize'],
        colors: [],
        tags: ['trending'],
        inStock: true,
      };
      const res = await authFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Failed to add'); return; }
      toast.success('Added to carousel!');
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    try {
      const res = await authFetch(`/api/products/${p.id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Delete failed'); return; }
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      setDeleteConfirm(null);
      toast.success('Slide deleted');
    } catch {
      toast.error('Network error');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-daami-black flex items-center gap-2">
            <TrendingUp size={22} className="text-daami-gold" /> Trending Carousel
          </h1>
          <p className="text-sm text-daami-gray mt-1">
            Add new slides (image + details) or tap any product to add/remove it. Shows up to 12, newest first.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-daami-gold/15 text-daami-gold border border-daami-gold/30">
            {selected.length} in carousel
          </span>
          <button
            onClick={() => { setForm({ ...EMPTY, category: categories[0]?.slug || '' }); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-daami-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-daami-gold hover:text-daami-black transition-colors"
          >
            <Plus size={16} /> Add Slide
          </button>
        </div>
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
              <div
                key={p.id}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-white ${
                  on ? 'border-daami-gold shadow-md' : 'border-gray-200 hover:border-daami-gold/50'
                } ${savingId === p.id ? 'opacity-60' : ''}`}
              >
                <div onClick={() => toggle(p)} className="cursor-pointer">
                  <div className="relative aspect-[3/4] bg-daami-cream">
                    {p.images[0] && (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 20vw" />
                    )}
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
                </div>
                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p); }}
                  title="Delete permanently"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slide Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-daami-black">Add Carousel Slide</h2>
              <button onClick={() => setModalOpen(false)} className="text-daami-gray hover:text-daami-black"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Photos — front & back */}
              <div>
                <label className="block text-xs font-semibold text-daami-black mb-1.5">Photos — front &amp; back *</label>
                <div className="flex gap-3">
                  {[
                    { slot: 'front', ref: frontRef, label: 'Front *' },
                    { slot: 'back', ref: backRef, label: 'Back' },
                  ].map(({ slot, ref, label }) => (
                    <div key={slot}>
                      <input ref={ref} type="file" accept="image/*" onChange={handleUpload(slot)} className="hidden" />
                      {form[slot] ? (
                        <div className="relative aspect-[3/4] w-32 rounded-lg overflow-hidden border border-gray-200">
                          <Image src={form[slot]} alt={slot} fill className="object-cover" sizes="128px" />
                          <button onClick={() => ref.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 text-white text-[11px] font-semibold flex items-center justify-center transition-opacity">Change</button>
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">{slot}</span>
                        </div>
                      ) : (
                        <button onClick={() => ref.current?.click()} disabled={uploading === slot}
                          className="w-32 aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-daami-gold flex flex-col items-center justify-center gap-1.5 text-daami-gray disabled:opacity-60">
                          {uploading === slot ? <Loader2 size={20} className="animate-spin text-daami-gold" /> : <Upload size={20} />}
                          <span className="text-[11px] font-medium">{label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-daami-gray mt-1.5">Front shows first; on the carousel, tapping the shirt flips to the back.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-daami-black mb-1.5">Title / Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cherish Couple Tee"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-daami-gold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-daami-black mb-1.5">Category *</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-daami-gold bg-white">
                  {categories.length === 0 && <option value="">No categories — add one first</option>}
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-daami-black mb-1.5">Price (NPR) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="1399"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-daami-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-daami-black mb-1.5">Original (optional)</label>
                  <input type="number" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    placeholder="1799"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-daami-gold" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-daami-black hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-daami-gold text-daami-black text-sm font-bold py-2.5 rounded-lg hover:bg-daami-gold-dark transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Adding...' : 'Add to Carousel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-daami-black">Delete this slide?</h3>
            <p className="text-sm text-daami-gray mt-1">“{deleteConfirm.name}” will be permanently removed from your store.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
