'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, Package, Truck, Check, Clock, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/data/products';

const statusIcon = { Pending: Clock, Processing: Package, Shipped: Truck, Delivered: Check, Cancelled: ShoppingBag };
const statusColors = {
  Delivered: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-600',
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });

export default function OrdersPage() {
  const { isAuthenticated, user, authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="page-container py-24 text-center">
        <ShoppingBag size={40} className="mx-auto text-daami-gray mb-4" />
        <h2 className="text-2xl font-bold">Sign in to view your orders</h2>
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/auth/login" className="btn-primary">Login</Link>
          <Link href="/auth/register" className="btn-secondary">Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-daami-cream min-h-[60vh] py-12">
      <div className="page-container max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-daami-black">My Orders</h1>
            <p className="text-daami-gray text-sm mt-0.5">Welcome back, <strong>{user?.name}</strong>!</p>
          </div>
          <button onClick={fetchOrders} className="btn-secondary py-2 px-3" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="w-7 h-7 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 text-center shadow-sm border border-gray-100">
            <ShoppingBag size={40} className="mx-auto text-daami-gray mb-4" />
            <p className="text-daami-dark-gray font-semibold">No orders yet</p>
            <p className="text-daami-gray text-sm mt-1">Start shopping to see your orders here.</p>
            <Link href="/products" className="btn-primary mt-6 inline-block">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const StatusIcon = statusIcon[order.status] || ShoppingBag;
              const payment = Array.isArray(order.payment) ? order.payment[0] : order.payment;
              return (
                <div key={order.id} className="bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-daami-gray">Order ID</p>
                      <p className="font-bold text-sm text-daami-black font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-daami-gray">Date</p>
                      <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-daami-gray">Total</p>
                      <p className="text-sm font-bold text-daami-gold">{formatPrice(order.total)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      <StatusIcon size={11} /> {order.status}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-daami-dark-gray">{item.name}</p>
                          <p className="text-xs text-daami-gray">Size: {item.size}{item.color ? ` · ${item.color}` : ''} × {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-xs">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-between text-xs text-daami-gray">
                    <span>Paid via: <strong className="text-daami-dark-gray">{payment?.method || '—'}</strong></span>
                    <Link href="/products" className="text-daami-gold hover:underline font-medium">Buy Again</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
