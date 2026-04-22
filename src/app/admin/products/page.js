'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Search, X, Check, ChevronDown, RefreshCw, Upload, Star, TrendingUp, Sparkles } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', category: '', price: '', originalPrice: '', description: '',
  sizes: 'Freesize, XL', colors: '', material: '', care: '', badge: '',
  inStock: true, featured: false, tags: [],
  images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=720&fit=crop'],
};

const TAG_OPTIONS = [
  { value: 'trending', label: 'Trending', icon: TrendingUp, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { value: 'new-arrivals', label: 'New Arrival', icon: Sparkles, color: 'text-blue-500 bg-blue-50 border-blue-200' },
];

export default function AdminProductsPage() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileInputRef = useRef(null);
  const currentUploadIdx = useRef(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.includes(search.toLowerCase())
  );

  const parseTags = (tags) => Array.isArray(tags) ? tags : JSON.parse(tags || '[]');
  const parseArr = (v) => Array.isArray(v) ? v : JSON.parse(v || '[]');

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, category: categories[0]?.slug || '' });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setForm({
      ...p,
      sizes: parseArr(p.sizes).join(', '),
      colors: parseArr(p.colors).join(', '),
      images: parseArr(p.images),
      tags: parseTags(p.tags),
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      featured: !!p.featured,
      inStock: !!p.inStock,
    });
    setEditingId(p.id);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    const idx = currentUploadIdx.current;
    if (!file) return;
    setUploadingIdx(idx);
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
      setForm(f => {
        const imgs = Array.isArray(f.images) ? [...f.images] : [f.images || ''];
        imgs[idx] = data.url;
        return { ...f, images: imgs };
      });
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingIdx(null);
      e.target.value = '';
    }
  };

  const triggerUpload = (idx) => {
    currentUploadIdx.current = idx;
    fileInputRef.current?.click();
  };

  const setColorImage = (idx, url) => {
    setForm(f => {
      const imgs = Array.isArray(f.images) ? [...f.images] : [f.images || ''];
      imgs[idx] = url;
      return { ...f, images: imgs };
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) { toast.error('Name, price and category are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
        images: Array.isArray(form.images) ? form.images : [form.images],
        tags: Array.isArray(form.tags) ? form.tags : [],
        featured: !!form.featured,
        slug: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        rating: form.rating ?? 4.5,
        reviews: form.reviews ?? 0,
      };
      const res = editingId
        ? await authFetch(`/api/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await authFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Save failed'); return; }
      toast.success(editingId ? 'Product updated!' : 'Product added!');
      setModalOpen(false);
      fetchProducts();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Delete failed'); return; }
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
      toast.success('Product deleted');
    } catch {
      toast.error('Network error');
    }
  };

  const getImage = (p) => {
    const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
    return imgs[0] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-daami-black">Products</h1>
          <p className="text-sm text-daami-gray mt-0.5">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchProducts} className="btn-secondary py-2.5 px-3" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 py-2.5">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category..." className="input-field pl-10 max-w-sm" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden md:table-cell">Display</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => {
                const tags = parseTags(p.tags);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 shrink-0 overflow-hidden bg-daami-cream">
                          {getImage(p) && <Image src={getImage(p)} alt={p.name} fill className="object-cover" sizes="40px" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-daami-black text-xs truncate max-w-[160px]">{p.name}</p>
                          {p.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                              p.badge === 'Sale' ? 'bg-red-100 text-red-600' :
                              p.badge === 'Bestseller' ? 'bg-daami-gold/20 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{p.badge}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="capitalize text-xs text-daami-dark-gray bg-gray-100 px-2 py-0.5 rounded">{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-xs text-daami-black">{formatPrice(p.price)}</p>
                      {p.originalPrice && <p className="text-[10px] text-daami-gray line-through">{formatPrice(p.originalPrice)}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-daami-gold/20 text-amber-700 font-semibold flex items-center gap-0.5">
                            <Star size={8} fill="currentColor" /> Featured
                          </span>
                        )}
                        {tags.includes('trending') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold flex items-center gap-0.5">
                            <TrendingUp size={8} /> Trending
                          </span>
                        )}
                        {tags.includes('new-arrivals') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold flex items-center gap-0.5">
                            <Sparkles size={8} /> New
                          </span>
                        )}
                        {!p.featured && !tags.length && <span className="text-[9px] text-daami-gray">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-daami-gray hover:text-daami-gold hover:bg-daami-cream transition-colors rounded" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {deleteConfirm === p.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Check size={14} /></button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-daami-gray hover:text-red-500 hover:bg-red-50 transition-colors rounded" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-daami-gray py-10 text-sm">No products found.</p>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-daami-black">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-daami-gray hover:text-daami-black"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-field">Product Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Premium Cotton T-Shirt" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Category *</label>
                  <div className="relative">
                    <select name="category" value={form.category} onChange={handleChange} className="input-field appearance-none pr-8 cursor-pointer">
                      {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-daami-gray" />
                  </div>
                </div>
                <div>
                  <label className="label-field">Badge</label>
                  <div className="relative">
                    <select name="badge" value={form.badge || ''} onChange={handleChange} className="input-field appearance-none pr-8 cursor-pointer">
                      <option value="">None</option>
                      <option value="New">New</option>
                      <option value="Sale">Sale</option>
                      <option value="Bestseller">Bestseller</option>
                      <option value="Hot">Hot</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-daami-gray" />
                  </div>
                </div>
                <div>
                  <label className="label-field">Price (NPR) *</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="1999" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Original Price (for strike-through)</label>
                  <input name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange} placeholder="2499" className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="label-field">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product description..." className="input-field resize-none" />
                </div>
                <div>
                  <label className="label-field">Sizes (comma-separated)</label>
                  <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="Freesize, XL" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Colors (comma-separated)</label>
                  <input name="colors" value={form.colors} onChange={handleChange} placeholder="White, Black, Navy" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Material</label>
                  <input name="material" value={form.material} onChange={handleChange} placeholder="100% Cotton" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Care Instructions</label>
                  <input name="care" value={form.care} onChange={handleChange} placeholder="Machine wash cold" className="input-field" />
                </div>
              </div>

              {/* Product Images — one per color */}
              <div>
                <label className="label-field">Product Photos (one per color)</label>
                <p className="text-[11px] text-daami-gray mb-3 -mt-1">
                  Each color gets its own photo. Add colors above first, then upload a photo for each.
                </p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {(() => {
                  const colorList = form.colors.split(',').map(c => c.trim()).filter(Boolean);
                  if (colorList.length === 0) {
                    // No colors yet — show single default image slot
                    const imgs = Array.isArray(form.images) ? form.images : [form.images || ''];
                    return (
                      <div className="border border-gray-200 p-3 space-y-2">
                        <p className="text-xs font-medium text-daami-gray">Default Image</p>
                        <div className="flex gap-2">
                          <input
                            value={imgs[0] || ''}
                            onChange={e => setColorImage(0, e.target.value)}
                            placeholder="Paste image URL or choose file..."
                            className="input-field flex-1 text-xs"
                          />
                          <button type="button" onClick={() => triggerUpload(0)} disabled={uploadingIdx === 0}
                            className="btn-secondary flex items-center gap-1.5 px-3 shrink-0 text-xs disabled:opacity-60">
                            {uploadingIdx === 0 ? <span className="w-3 h-3 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                            Choose
                          </button>
                        </div>
                        {imgs[0] && (
                          <div className="relative w-16 h-20 border border-gray-100 overflow-hidden bg-daami-cream">
                            <Image src={imgs[0]} alt="Preview" fill className="object-cover" sizes="64px" onError={() => {}} />
                          </div>
                        )}
                      </div>
                    );
                  }
                  const imgs = Array.isArray(form.images) ? [...form.images] : [form.images || ''];
                  return (
                    <div className="space-y-3">
                      {colorList.map((color, idx) => (
                        <div key={color + idx} className="border border-gray-200 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-daami-black">{color}</span>
                            <span className="text-[10px] text-daami-gray">(image {idx + 1})</span>
                            {imgs[idx] && <span className="text-[10px] text-green-600 font-medium ml-auto">✓ Uploaded</span>}
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={imgs[idx] || ''}
                              onChange={e => setColorImage(idx, e.target.value)}
                              placeholder={`Photo for ${color}...`}
                              className="input-field flex-1 text-xs"
                            />
                            <button type="button" onClick={() => triggerUpload(idx)} disabled={uploadingIdx === idx}
                              className="btn-secondary flex items-center gap-1.5 px-3 shrink-0 text-xs disabled:opacity-60">
                              {uploadingIdx === idx ? <span className="w-3 h-3 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                              Choose
                            </button>
                          </div>
                          {imgs[idx] && (
                            <div className="relative w-16 h-20 border border-gray-100 overflow-hidden bg-daami-cream">
                              <Image src={imgs[idx]} alt={color} fill className="object-cover" sizes="64px" onError={() => {}} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Frontend Display Controls */}
              <div className="border border-daami-gold/30 bg-daami-cream/50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-daami-black">Frontend Display</p>
                <p className="text-[11px] text-daami-gray -mt-1">Control where this product appears on the homepage and shop.</p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="featured" checked={!!form.featured} onChange={handleChange} className="accent-daami-gold w-4 h-4" />
                  <div>
                    <span className="text-sm font-semibold text-daami-black flex items-center gap-1.5">
                      <Star size={13} className="text-daami-gold fill-daami-gold" /> Featured
                    </span>
                    <p className="text-[10px] text-daami-gray">Shows in the "Featured" tab on the homepage</p>
                  </div>
                </label>

                <div>
                  <p className="text-xs font-medium text-daami-dark-gray mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map(tag => {
                      const active = Array.isArray(form.tags) && form.tags.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleTag(tag.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-full transition-all ${
                            active ? tag.color + ' border-current' : 'border-gray-200 text-daami-gray hover:border-gray-300'
                          }`}
                        >
                          <tag.icon size={11} />
                          {tag.label}
                          {active && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-daami-gray mt-1.5">
                    Trending → shows in "Trending" tab · New Arrival → shows in "New Arrivals" tab
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="inStock" checked={!!form.inStock} onChange={handleChange} className="accent-green-500 w-4 h-4" />
                  <span className="text-sm font-medium text-daami-dark-gray">In Stock</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-none px-6">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
