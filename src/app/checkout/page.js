'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { formatPrice } from '@/data/products';
import { ChevronRight, Check, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Cart', 'Delivery', 'Payment', 'Confirm'];

const ALL_PAYMENT_METHODS = [
  { id: 'khalti', label: 'Khalti', description: 'Pay with your Khalti wallet', color: '#5C2D91', key: 'khaltiEnabled' },
  { id: 'esewa', label: 'eSewa', description: 'Pay using eSewa digital wallet', color: '#60BB46', key: 'esewaEnabled' },
  { id: 'stripe', label: 'Stripe (Card)', description: 'Pay with Visa / MasterCard', color: '#635BFF', key: 'stripeEnabled' },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your order arrives', color: '#374151', key: 'codEnabled' },
];

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { isAuthenticated, user, authFetch } = useAuth();
  const { freeShippingThreshold, shippingFee, ...paymentSettings } = useSettings();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const paymentMethods = ALL_PAYMENT_METHODS.filter(m => paymentSettings[m.key]);

  const [form, setForm] = useState({
    name: user?.name || '',
    location: '',
    phone: user?.phone || '',
    notes: '',
  });

  const shipping = cartTotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = cartTotal + shipping;

  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validateDelivery = () => {
    if (!form.name.trim()) { toast.error('Full name is required'); return false; }
    if (!form.location.trim()) { toast.error('Location is required'); return false; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return false; }
    return true;
  };

  const validatePayment = () => {
    if (!paymentMethod) { toast.error('Please select a payment method'); return false; }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validatePayment()) return;
    setLoading(true);

    try {
      // 1. Create the order in database
      const address = {
        name: form.name,
        location: form.location,
        phone: form.phone,
      };

      const orderItems = items.map(item => ({
        productId: item.product.id || null,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      const orderRes = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderItems,
          address,
          notes: form.notes || null,
          paymentMethod,
          shipping,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        toast.error(err.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      const { order } = await orderRes.json();
      const createdOrderId = order.id;

      // 2. Handle payment gateway redirect
      if (paymentMethod === 'cod') {
        clearCart();
        setOrderId(createdOrderId);
        setStep(3);
        toast.success('Order placed! Pay on delivery.');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'khalti') {
        const khaltiRes = await authFetch('/api/payment/khalti', {
          method: 'POST',
          body: JSON.stringify({
            orderId: createdOrderId,
            amount: total,
            orderName: `Daami Clothing Order #${createdOrderId.slice(-6)}`,
          }),
        });
        const khaltiData = await khaltiRes.json();
        if (!khaltiRes.ok) { toast.error(khaltiData.error || 'Khalti initiation failed'); setLoading(false); return; }
        clearCart();
        window.location.href = khaltiData.paymentUrl;
        return;
      }

      if (paymentMethod === 'esewa') {
        const esewaRes = await authFetch('/api/payment/esewa', {
          method: 'POST',
          body: JSON.stringify({ orderId: createdOrderId, amount: total }),
        });
        const esewaData = await esewaRes.json();
        if (!esewaRes.ok) { toast.error(esewaData.error || 'eSewa initiation failed'); setLoading(false); return; }

        // eSewa requires a form POST
        clearCart();
        const form_el = document.createElement('form');
        form_el.method = 'POST';
        form_el.action = esewaData.paymentUrl;
        Object.entries(esewaData.formData).forEach(([key, val]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = val;
          form_el.appendChild(input);
        });
        document.body.appendChild(form_el);
        form_el.submit();
        return;
      }

      if (paymentMethod === 'stripe') {
        const stripeRes = await authFetch('/api/payment/stripe', {
          method: 'POST',
          body: JSON.stringify({ orderId: createdOrderId, amount: total }),
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok) { toast.error(stripeData.error || 'Stripe initiation failed'); setLoading(false); return; }
        clearCart();
        router.push(`/checkout/payment-success?method=stripe&orderId=${createdOrderId}&clientSecret=${stripeData.clientSecret}`);
        return;
      }

    } catch {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0 && step < 3) {
    return (
      <div className="page-container py-24 text-center">
        <h2 className="text-xl font-bold">Your cart is empty.</h2>
        <Link href="/products" className="btn-primary mt-6 inline-block">Shop Now</Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-container py-24 text-center">
        <Lock size={40} className="mx-auto text-daami-gold mb-4" />
        <h2 className="text-2xl font-bold">Login Required</h2>
        <p className="text-daami-gray mt-2">Please log in to complete your purchase.</p>
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/auth/login" className="btn-primary">Login</Link>
          <Link href="/auth/register" className="btn-secondary">Create Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-daami-cream min-h-screen py-10">
      <div className="page-container max-w-5xl">
        {/* Progress */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => {
            const isActive = step === i;
            const isDone = step > i;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-daami-gold text-daami-black' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-medium hidden sm:block ${
                    isActive ? 'text-daami-gold' : isDone ? 'text-green-600' : 'text-gray-400'
                  }`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-16 md:w-24 mx-2 mb-4 sm:mb-0 transition-all ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* STEP 1: Delivery */}
            {step === 1 && (
              <div className="bg-white p-6 md:p-8">
                <h2 className="text-xl font-bold text-daami-black mb-6">Delivery Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label-field">Full Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="Your full name" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Location *</label>
                    <input type="text" name="location" value={form.location} onChange={handleFormChange} placeholder="City, District, Street address" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Phone Number *</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleFormChange} placeholder="98XXXXXXXX" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Order Notes (optional)</label>
                    <textarea name="notes" value={form.notes} onChange={handleFormChange} placeholder="e.g. Leave at gate, call before delivery..." rows={3} className="input-field resize-none" />
                  </div>
                </div>
                <button
                  onClick={() => { if (validateDelivery()) setStep(2); }}
                  className="btn-primary w-full mt-8 py-4 flex items-center justify-center gap-2"
                >
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="bg-white p-6 md:p-8">
                <h2 className="text-xl font-bold text-daami-black mb-6">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map(method => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-daami-gold bg-daami-cream'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="mt-0.5 accent-daami-gold"
                      />
                      <div>
                        <p className="text-sm font-bold" style={{ color: method.color }}>{method.label}</p>
                        <p className="text-xs text-daami-gray mt-0.5">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-none px-6">← Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : (
                      <><Lock size={14} /> Place Order — {formatPrice(total)}</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirmation (COD) */}
            {step === 3 && (
              <div className="bg-white p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check size={32} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-daami-black mt-5">Order Confirmed!</h2>
                <p className="text-daami-gray mt-2">
                  Thank you, <strong>{form.name}</strong>! Your order has been placed.
                </p>
                <p className="text-sm text-daami-gray mt-1">
                  Order ID: <strong className="text-daami-black font-mono">#{orderId.slice(-8).toUpperCase()}</strong>
                </p>
                <div className="bg-daami-cream p-5 mt-6 text-left text-sm space-y-2">
                  <p><span className="text-daami-gray">Delivery to:</span> <strong>{form.location}</strong></p>
                  <p><span className="text-daami-gray">Phone:</span> <strong>{form.phone}</strong></p>
                  <p><span className="text-daami-gray">Payment:</span> <strong>Cash on Delivery</strong></p>
                  <p><span className="text-daami-gray">Estimated delivery:</span> <strong>2-4 days</strong></p>
                </div>
                <div className="flex gap-4 justify-center mt-8">
                  <Link href="/products" className="btn-primary">Continue Shopping</Link>
                  <Link href="/orders" className="btn-secondary">My Orders</Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 sticky top-24">
              <h3 className="text-base font-bold text-daami-black mb-4">Your Order ({step < 3 ? items.length : '—'} items)</h3>
              {step < 3 && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.key} className="flex gap-3">
                      <div className="relative w-14 h-16 shrink-0 bg-daami-cream overflow-hidden">
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-daami-gold text-white text-[9px] rounded-full flex items-center justify-center font-bold">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-daami-black leading-snug line-clamp-2">{item.product.name}</p>
                        <p className="text-[10px] text-daami-gray mt-0.5">{item.size} / {item.color}</p>
                        <p className="text-xs font-bold text-daami-black mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-daami-gray">
                  <span>Subtotal</span>
                  <span>{formatPrice(step < 3 ? cartTotal : 0)}</span>
                </div>
                <div className="flex justify-between text-daami-gray">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span className="text-daami-gold">{formatPrice(step < 3 ? total : 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
