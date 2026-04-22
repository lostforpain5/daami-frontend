'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, X, Check, RefreshCw, Upload, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  title: '', tag: '', subtitle: '',
  cta: 'Shop Now', ctaHref: '/products',
  secondaryCta: 'View All', secondaryHref: '/products',
  image: '', align: 'left', active: true,
};

export default function AdminBannersPage() {
  const { authFetch } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setForm({ ...b });
    setEditingId(b.id);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
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

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    if (!form.image) { toast.error('Banner image is required'); return; }
    setSaving(true);
    try {
      const res = editingId
        ? await authFetch(`/api/banners/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
        : await authFetch('/api/banners', { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Save failed'); return; }
      toast.success(editingId ? 'Banner updated!' : 'Banner added!');
      setModalOpen(false);
      fetchBanners();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Delete failed'); return; }
      setBanners(prev => prev.filter(b => b.id !== id));
      setDeleteConfirm(null);
      toast.success('Banner deleted');
    } catch {
      toast.error('Network error');
    }
  };

  const toggleActive = async (b) => {
    try {
      await authFetch(`/api/banners/${b.id}`, { method: 'PUT', body: JSON.stringify({ active: !b.active }) });
      setBanners(prev => prev.map(x => x.id === b.id ? { ...x, active: !x.active } : x));
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-daami-black">Banners</h1>
          <p className="text-sm text-daami-gray mt-0.5">Manage homepage hero slides — upload your own photos and edit text</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchBanners} className="btn-secondary py-2.5 px-3" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2 py-2.5">
            <Plus size={16} /> Add Banner
          </button>
        </div>
      </div>

      {/* Banner Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white border border-gray-100">
            <span className="w-6 h-6 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white border border-gray-100 py-16 text-center">
            <p className="text-daami-gray text-sm mb-4">No banners yet. Add your first hero slide.</p>
            <button onClick={openAdd} className="btn-gold flex items-center gap-2 mx-auto">
              <Plus size={16} /> Add First Banner
            </button>
          </div>
        ) : (
          banners.map((b, i) => (
            <div key={b.id} className={`bg-white border border-gray-100 shadow-sm flex gap-0 overflow-hidden ${!b.active ? 'opacity-60' : ''}`}>
              {/* Thumbnail */}
              <div className="relative w-32 md:w-48 shrink-0 bg-daami-black">
                {b.image ? (
                  <Image src={b.image} alt={b.title} fill className="object-cover opacity-80" sizes="192px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">No image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                <div className="absolute top-2 left-2 text-white/70 text-xs font-bold">#{i + 1}</div>
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  {b.tag && <span className="text-[10px] uppercase tracking-widest text-daami-gold font-semibold">{b.tag}</span>}
                  <h3 className="font-bold text-daami-black text-sm mt-0.5 whitespace-pre-line leading-snug">{b.title}</h3>
                  {b.subtitle && <p className="text-xs text-daami-gray mt-1 line-clamp-2">{b.subtitle}</p>}
                  <div className="flex gap-3 mt-2 text-[10px] text-daami-gray">
                    <span>CTA: <span className="text-daami-black font-medium">{b.cta}</span> → {b.ctaHref}</span>
                    <span className="hidden md:block">Align: <span className="font-medium capitalize">{b.align}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center justify-center gap-1.5 p-3 border-l border-gray-100 shrink-0">
                <button onClick={() => toggleActive(b)} className={`p-1.5 rounded transition-colors ${b.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={b.active ? 'Hide banner' : 'Show banner'}>
                  {b.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => openEdit(b)} className="p-1.5 text-daami-gray hover:text-daami-gold hover:bg-daami-cream rounded" title="Edit">
                  <Edit2 size={14} />
                </button>
                {deleteConfirm === b.id ? (
                  <>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Check size={14} /></button>
                    <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 text-daami-gray hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tip */}
      {banners.length > 0 && (
        <p className="text-xs text-daami-gray bg-daami-cream/60 border border-daami-cream p-3">
          Tip: Banners show in order on the homepage hero slider. Use the eye icon to show/hide individual banners without deleting them.
        </p>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-daami-black">{editingId ? 'Edit Banner' : 'Add New Banner'}</h2>
                <p className="text-xs text-daami-gray mt-0.5">This will appear as a slide in the homepage hero section</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-daami-gray hover:text-daami-black"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="label-field">Banner Image *</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      name="image"
                      value={form.image}
                      onChange={handleChange}
                      placeholder="Paste image URL or choose file..."
                      className="input-field flex-1"
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="btn-gold flex items-center gap-2 px-4 shrink-0 disabled:opacity-60">
                      {uploading ? <span className="w-4 h-4 border-2 border-daami-black border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
                      {uploading ? 'Uploading...' : 'Choose'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                  {form.image && (
                    <div className="relative w-full h-32 bg-daami-black overflow-hidden">
                      <Image src={form.image} alt="Preview" fill className="object-cover opacity-80" sizes="600px" onError={() => {}} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-4">
                        <div>
                          {form.tag && <p className="text-daami-gold text-[10px] uppercase tracking-widest">{form.tag}</p>}
                          <p className="text-white font-bold text-sm whitespace-pre-line">{form.title || 'Your Title'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Tag / Collection Label</label>
                  <input name="tag" value={form.tag} onChange={handleChange} placeholder="e.g. New Collection 2025" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Text Alignment</label>
                  <select name="align" value={form.align} onChange={handleChange} className="input-field">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label-field">Main Title * <span className="text-daami-gray font-normal">(use \n for line breaks)</span></label>
                  <textarea name="title" value={form.title} onChange={handleChange} rows={2} placeholder="e.g. Wear Your\nStory" className="input-field resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="label-field">Subtitle / Description</label>
                  <textarea name="subtitle" value={form.subtitle} onChange={handleChange} rows={2} placeholder="Short description shown under the title..." className="input-field resize-none" />
                </div>
              </div>

              {/* CTAs */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-daami-gray mb-3">Call to Action Buttons</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">Primary Button Text</label>
                    <input name="cta" value={form.cta} onChange={handleChange} placeholder="Shop Now" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Primary Button Link</label>
                    <input name="ctaHref" value={form.ctaHref} onChange={handleChange} placeholder="/products" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Secondary Button Text</label>
                    <input name="secondaryCta" value={form.secondaryCta} onChange={handleChange} placeholder="View All" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Secondary Button Link</label>
                    <input name="secondaryHref" value={form.secondaryHref} onChange={handleChange} placeholder="/products" className="input-field" />
                  </div>
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="active" checked={!!form.active} onChange={handleChange} className="accent-daami-gold w-4 h-4" />
                <div>
                  <span className="text-sm font-semibold text-daami-black">Active (visible on homepage)</span>
                  <p className="text-[10px] text-daami-gray">Uncheck to hide this slide without deleting it</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-none px-6">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                {editingId ? 'Update Banner' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
