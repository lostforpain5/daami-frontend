'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Phone, Edit2, Trash2, Check, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

export default function AdminCustomersPage() {
  const { authFetch } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const openEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone || '', password: '' });
    setEditingCustomer(c);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      const res = await authFetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Update failed'); return; }
      toast.success('Customer updated!');
      setEditingCustomer(null);
      fetchCustomers();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Delete failed'); return; }
      setCustomers(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
      toast.success('Customer deleted');
    } catch {
      toast.error('Network error');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-daami-black">Customers</h1>
          <p className="text-sm text-daami-gray mt-0.5">{filtered.length} registered customer{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchCustomers} className="btn-secondary py-2.5 px-3" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-daami-gray" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..." className="input-field pl-9 py-2" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black">
            <X size={14} />
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
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Total Spent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-daami-gold flex items-center justify-center text-daami-black font-bold text-xs shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-xs text-daami-black">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-daami-gray flex items-center gap-1"><Mail size={10} />{c.email}</span>
                      {c.phone && <span className="text-xs text-daami-gray flex items-center gap-1"><Phone size={10} />{c.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-center">{c.orderCount}</td>
                  <td className="px-4 py-3 text-xs font-bold text-daami-gold">
                    {c.totalSpent > 0 ? `Rs. ${c.totalSpent.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-daami-gray hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-daami-gray hover:text-daami-gold hover:bg-daami-cream rounded" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      {deleteConfirm === c.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Confirm delete">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 text-daami-gray hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
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
        {!loading && filtered.length === 0 && (
          <p className="text-center text-daami-gray py-10 text-sm">No customers found.</p>
        )}
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingCustomer(null)}>
          <div className="bg-white w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-daami-black">Edit Customer</h2>
                <p className="text-xs text-daami-gray mt-0.5">ID: {editingCustomer.id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-daami-gray hover:text-daami-black">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label-field">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Customer name" />
              </div>
              <div>
                <label className="label-field">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@example.com" />
              </div>
              <div>
                <label className="label-field">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="9800000000" />
              </div>
              <div>
                <label className="label-field">New Password <span className="text-daami-gray font-normal">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-field pr-10"
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setEditingCustomer(null)} className="btn-secondary flex-none px-6">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
