'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, X, RefreshCw, ImageIcon } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const statusColors = {
  Delivered: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-600',
};

const allStatuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const customerName = o.user?.name || '';
    const matchSearch = o.id.includes(search) || customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await authFetch(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error('Update failed'); return; }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (selectedOrder?.id === id) setSelectedOrder(prev => ({ ...prev, status }));
    } catch {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getAddress = (order) => {
    try {
      const addr = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;
      if (addr.district && addr.province) {
        const parts = [addr.deliveryType, addr.district, addr.province];
        if (addr.address) parts.push(addr.address);
        if (addr.branch) parts.push(`Branch: ${addr.branch}`);
        return parts.filter(Boolean).join(' · ');
      }
      if (addr.location) return `${addr.location}${addr.phone ? ' · ' + addr.phone : ''}`;
      return `${addr.address || ''}, ${addr.city || ''}, ${addr.district || ''}`.replace(/^,\s*|,\s*$/g, '');
    } catch { return order.address || '—'; }
  };

  const getPaymentMethod = (order) => {
    if (!order.payment) return '—';
    const p = Array.isArray(order.payment) ? order.payment[0] : order.payment;
    return p?.method || '—';
  };

  const getScreenshotUrl = (order) => {
    if (!order.notes) return null;
    const match = order.notes.match(/Screenshot:\s*(\S+)/);
    return match ? match[1] : null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-daami-black">Orders</h1>
          <p className="text-sm text-daami-gray mt-0.5">{filtered.length} order{filtered.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary py-2.5 px-3" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-daami-gray" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order or customer..."
            className="input-field pl-9 w-64 py-2"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 font-medium transition-all border ${
                statusFilter === s
                  ? 'bg-daami-gold border-daami-gold text-daami-black'
                  : 'border-gray-200 text-daami-gray hover:border-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
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
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden sm:table-cell">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden lg:table-cell">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-daami-black">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs text-daami-dark-gray">{order.user?.name || 'Guest'}</p>
                    <p className="text-[10px] text-daami-gray">{order.user?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-daami-gray hidden md:table-cell">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-xs hidden sm:table-cell">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-daami-dark-gray bg-gray-100 px-2 py-0.5 rounded">{getPaymentMethod(order)}</span>
                      {getScreenshotUrl(order) && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Screenshot</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full appearance-none cursor-pointer pr-5 disabled:opacity-60 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {allStatuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-daami-gray hover:text-daami-gold hover:bg-daami-cream transition-colors rounded"
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-daami-gray py-10 text-sm">No orders found.</p>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-daami-black">Order #{selectedOrder.id.slice(-8).toUpperCase()}</h2>
                <p className="text-xs text-daami-gray mt-0.5">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-daami-gray hover:text-daami-black">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-daami-gray uppercase tracking-wider font-medium mb-1">Customer</p>
                  <p className="font-semibold">{selectedOrder.user?.name || 'Guest'}</p>
                  <p className="text-daami-gray text-xs">{selectedOrder.user?.email}</p>
                  <p className="text-daami-gray text-xs">{selectedOrder.user?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-daami-gray uppercase tracking-wider font-medium mb-1">Delivery Address</p>
                  <p className="text-xs text-daami-dark-gray">{getAddress(selectedOrder)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-daami-gray uppercase tracking-wider font-medium mb-2">Items Ordered</p>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-daami-cream px-3 py-2">
                      <div>
                        <p className="font-medium text-daami-black text-xs">{item.name}</p>
                        <p className="text-[10px] text-daami-gray">Size: {item.size} · Color: {item.color} · Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-xs">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-daami-gray">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.total - (selectedOrder.shipping || 0))}</span>
                </div>
                <div className="flex justify-between text-daami-gray">
                  <span>Shipping</span>
                  <span>{selectedOrder.shipping === 0 ? 'FREE' : formatPrice(selectedOrder.shipping || 150)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-daami-gold">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-daami-gray text-xs">Payment: </span>
                  <span className="font-semibold text-xs">{getPaymentMethod(selectedOrder)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-daami-gray text-xs">Status:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {allStatuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const screenshotUrl = getScreenshotUrl(selectedOrder);
                if (!screenshotUrl) return null;
                return (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-daami-gray uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                      <ImageIcon size={12} /> Payment Screenshot
                    </p>
                    <a href={screenshotUrl} target="_blank" rel="noreferrer" className="block group">
                      <img
                        src={screenshotUrl}
                        alt="Payment screenshot"
                        className="w-full max-h-72 object-contain bg-gray-50 border border-gray-200 group-hover:border-daami-gold transition-colors rounded"
                      />
                      <p className="text-[10px] text-daami-gray mt-1 text-center group-hover:text-daami-gold transition-colors">
                        Click to open full size
                      </p>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
