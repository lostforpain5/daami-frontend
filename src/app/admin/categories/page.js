'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Check, X, Upload, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_FORM = { slug: '', label: '', description: '', image: '', bannerImage: '' };

export default function AdminCategoriesPage() {
  const { authFetch } = useAuth();
  const [cats, setCats] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);
      const catsData = await catsRes.json();
      const prodsData = await prodsRes.json();

      setCats(catsData.categories || []);

      const counts = {};
      (prodsData.products || []).forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
        const tags = Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]');
        tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      });
      setProductCounts(counts);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true); };
  const openEdit = (cat) => {
    setForm({ slug: cat.slug, label: cat.label, description: cat.description, image: cat.image, bannerImage: cat.bannerImage || '' });
    setEditingId(cat.id);
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
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
      setForm(f => ({ ...f, image: data.url }));
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
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
      setForm(f => ({ ...f, bannerImage: data.url }));
      toast.success('Banner image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.label) { toast.error('Label is required'); return; }
    if (!editingId && !form.slug) { toast.error('Slug is required'); return; }
    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await authFetch(`/api/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ label: form.label, description: form.description, image: form.image, bannerImage: form.bannerImage }),
        });
      } else {
        res = await authFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Save failed'); return; }
      toast.success(editingId ? 'Category updated!' : 'Category added!');
      setModalOpen(false);
      fetchAll();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Delete failed'); return; }
      setCats(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
      toast.success('Category deleted');
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-daami-black">Categories</h1>
          <p className="text-sm text-daami-gray mt-0.5">{cats.length} categories</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchAll} className="btn-secondary py-2.5 px-3" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 py-2.5">
            <Plus size={16} /> Add Category
          </button>
        </div>
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
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Products</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cats.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <div className="relative w-10 h-10 shrink-0 overflow-hidden bg-daami-cream rounded">
                          <Image src={cat.image} alt={cat.label} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-daami-cream rounded flex items-center justify-center shrink-0">
                          <span className="text-xs text-daami-gray font-bold">{cat.label.slice(0,2).toUpperCase()}</span>
                        </div>
                      )}
                      <p className="font-semibold text-xs text-daami-black">{cat.label}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{cat.slug}</code>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-daami-gray truncate max-w-[200px]">{cat.description || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-daami-cream text-daami-gold-dark px-2 py-0.5 rounded">
                      {productCounts[cat.slug] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-daami-gray hover:text-daami-gold hover:bg-daami-cream rounded" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      {deleteConfirm === cat.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Confirm">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 text-daami-gray hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && cats.length === 0 && (
          <p className="text-center text-daami-gray py-10 text-sm">No categories yet. Add one to get started.</p>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-daami-black">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-daami-gray hover:text-daami-black">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label-field">Label *</label>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({
                    ...f,
                    label: e.target.value,
                    ...(!editingId && { slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }),
                  }))}
                  placeholder="e.g. Summer Collection"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">Slug * {editingId && <span className="text-[10px] text-daami-gray ml-1">(cannot change)</span>}</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. summer-collection"
                  disabled={!!editingId}
                  className="input-field font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="label-field">Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description"
                  className="input-field"
                />
              </div>
              {/* Thumbnail Image */}
              <div>
                <label className="label-field">Front Display Image <span className="text-daami-gray font-normal text-[10px]">— shown in category grid on homepage</span></label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={form.image}
                      onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                      placeholder="Paste image URL or choose file..."
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn-secondary flex items-center gap-2 px-4 shrink-0 disabled:opacity-60"
                    >
                      {uploading
                        ? <span className="w-4 h-4 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
                        : <Upload size={14} />}
                      {uploading ? 'Uploading...' : 'Choose'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                  {form.image && (
                    <div className="relative w-24 h-32 overflow-hidden bg-daami-cream rounded border border-gray-100">
                      <Image src={form.image} alt="Thumbnail preview" fill className="object-cover" sizes="96px" onError={() => {}} />
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <label className="label-field">Banner Image <span className="text-daami-gray font-normal text-[10px]">— wide image shown at top of category page</span></label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={form.bannerImage}
                      onChange={e => setForm(f => ({ ...f, bannerImage: e.target.value }))}
                      placeholder="Paste image URL or choose file..."
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                      className="btn-secondary flex items-center gap-2 px-4 shrink-0 disabled:opacity-60"
                    >
                      {uploadingBanner
                        ? <span className="w-4 h-4 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
                        : <Upload size={14} />}
                      {uploadingBanner ? 'Uploading...' : 'Choose'}
                    </button>
                    <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </div>
                  {form.bannerImage && (
                    <div className="relative w-full h-24 overflow-hidden bg-daami-cream rounded border border-gray-100">
                      <Image src={form.bannerImage} alt="Banner preview" fill className="object-cover" sizes="400px" onError={() => {}} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100 shrink-0">
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-none px-6">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                {editingId ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
