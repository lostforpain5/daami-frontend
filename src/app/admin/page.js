'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Users, Package, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const statusColors = {
  Delivered: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const formatPrice = (n) => `Rs. ${Number(n).toLocaleString('en-NP')}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/stats');
      const json = await res.json();
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const stats = data ? [
    { label: 'Total Revenue', value: formatPrice(data.totalRevenue), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Total Orders', value: data.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Products', value: data.totalProducts.toLocaleString(), icon: Package, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Customers', value: data.totalCustomers.toLocaleString(), icon: Users, color: 'bg-daami-gold/10 text-amber-600' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-daami-black">Dashboard</h1>
          <p className="text-daami-gray text-sm mt-1">Welcome back! Here's your store overview.</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary py-2 px-3" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-5 border border-gray-100 shadow-sm animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-24 bg-gray-200 rounded" />
            </div>
          ))
        ) : stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-daami-gray uppercase tracking-wide">{label}</p>
                <p className="text-xl md:text-2xl font-bold text-daami-black mt-1.5">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-daami-black">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-daami-gold hover:underline font-medium">View All</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.recentOrders?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <ShoppingBag size={32} className="text-gray-200 mb-3" />
              <p className="text-sm text-daami-gray">No orders yet</p>
              <p className="text-xs text-daami-gray mt-1">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray hidden md:table-cell">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-daami-gray">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-daami-black text-xs">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] text-daami-gray">{formatDate(order.date)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-daami-dark-gray text-xs">{order.customer}</p>
                        <p className="text-[10px] text-daami-gray truncate max-w-[150px]">{order.product}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell font-semibold text-xs">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-daami-black">Top Products</h2>
            <Link href="/admin/products" className="text-xs text-daami-gold hover:underline font-medium">View All</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.topProducts?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Package size={32} className="text-gray-200 mb-3" />
              <p className="text-sm text-daami-gray">No sales data yet</p>
              <p className="text-xs text-daami-gray mt-1">Top sellers will appear once orders come in</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-daami-gray w-4">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-daami-black truncate">{p.name}</p>
                    <p className="text-[10px] text-daami-gray">{p.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
