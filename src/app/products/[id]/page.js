'use client';
import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star, Heart, ShoppingBag, Shield, Truck, Package, RefreshCw,
  ChevronRight, Minus, Plus, Share2, Check, X, CreditCard, Banknote, AlertCircle, Loader2, ImagePlus, MapPin
} from 'lucide-react';
import { formatPrice } from '@/data/products';
import { searchLocations, getDeliveryCharge } from '@/data/delivery';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import ProductCard from '@/components/products/ProductCard';
import toast from 'react-hot-toast';

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

// ─── Reusable field — defined outside modal so it never remounts on state change ───
function Field({ name, label, placeholder, type = 'text', value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-daami-black mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border px-4 py-3 text-sm outline-none transition-colors ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-daami-gold'}`}
      />
      {error && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Screenshot upload block ──────────────────────────────────────────────────
function ScreenshotUpload({ screenshot, setScreenshot, screenshotRef, screenshotUploading, error }) {
  return (
    <div>
      <p className="text-xs font-semibold text-daami-black mb-2">Payment Screenshot *</p>
      {!screenshot ? (
        <button
          type="button"
          onClick={() => screenshotRef.current?.click()}
          disabled={screenshotUploading}
          className={`w-full border-2 border-dashed py-5 px-4 flex flex-col items-center gap-2 transition-colors disabled:opacity-60 ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-daami-gold hover:bg-daami-cream/40'}`}
        >
          {screenshotUploading ? <Loader2 size={22} className="animate-spin text-daami-gold" /> : <ImagePlus size={22} className={error ? 'text-red-400' : 'text-daami-gray'} />}
          <span className={`text-sm font-medium ${error ? 'text-red-500' : 'text-daami-dark-gray'}`}>
            {screenshotUploading ? 'Uploading...' : 'Please Upload your payment screenshot'}
          </span>
          <span className="text-[11px] text-daami-gray">Tap to choose image from your phone or gallery</span>
        </button>
      ) : (
        <div className="border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-3">
            <img src={screenshot} alt="Payment screenshot" className="w-16 h-16 object-cover border border-gray-200 rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Check size={12} /> Screenshot uploaded</p>
              <button type="button" onClick={() => setScreenshot('')} className="text-[11px] text-red-500 hover:underline mt-1">Remove & re-upload</button>
            </div>
          </div>
        </div>
      )}
      {error && !screenshot && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5"><AlertCircle size={11} /> {error}</p>
      )}
    </div>
  );
}

// ─── Buy Now Modal ────────────────────────────────────────────────────────────
function BuyNowModal({ product, selectedSize, selectedColor, quantity, onClose }) {
  // step: delivery | details | payment | done
  const [step, setStep] = useState('delivery');
  const [deliveryType, setDeliveryType] = useState(''); // home | courier
  const [paymentMethod, setPaymentMethod] = useState(''); // online | cod
  const [form, setForm] = useState({ name: '', phone: '', address: '', location: '', branch: '' });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const screenshotRef = useRef(null);

  const productTotal = product.price * quantity;
  const deliveryCharge = form.location ? getDeliveryCharge(form.location, deliveryType) : 0;
  const grandTotal = productTotal + deliveryCharge;

  useEffect(() => {
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(data => setQrCode(data.settings?.paymentQrCode || ''))
      .catch(() => {});
  }, []);

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/screenshot', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Upload failed'); return; }
      setScreenshot(data.url);
    } catch { alert('Upload failed. Please try again.'); }
    finally { setScreenshotUploading(false); e.target.value = ''; }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleLocationSearch = (q) => {
    setLocationQuery(q);
    setForm(f => ({ ...f, location: '' }));
    setLocationSuggestions(q.length >= 2 ? searchLocations(q) : []);
    if (errors.location) setErrors(p => ({ ...p, location: '' }));
  };

  const selectLocation = (loc) => {
    setForm(f => ({ ...f, location: loc.name }));
    setLocationQuery(loc.name);
    setLocationSuggestions([]);
    setErrors(p => ({ ...p, location: '' }));
  };

  const validateDetails = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.location) e.location = 'Please select your location';
    if (deliveryType === 'home' && !form.address.trim()) e.address = 'Street address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e = {};
    if (!paymentMethod) e.payment = 'Please select a payment method';
    if (!screenshot) e.screenshot = 'Please upload your payment screenshot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validatePayment()) return;
    setPlacing(true);
    try {
      const addressData = {
        name: form.name,
        phone: form.phone,
        location: form.location,
        deliveryType: deliveryType === 'home' ? 'Home Delivery' : 'Courier Branch Pickup',
        ...(deliveryType === 'home' ? { address: form.address } : { branch: form.branch }),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: product.id, name: product.name, price: product.price, quantity, size: selectedSize || 'Freesize', color: selectedColor || '' }],
          shipping: deliveryCharge,
          address: addressData,
          notes: `${paymentMethod === 'online' ? 'Online Payment (QR)' : 'Cash On Delivery'} | Screenshot: ${screenshot}`,
          paymentMethod,
        }),
      });
      if (res.ok) setStep('done');
      else toast.error('Failed to place order. Please try again.');
    } catch { toast.error('Network error. Please try again.'); }
    finally { setPlacing(false); }
  };

  // Mini order summary bar
  const Summary = () => (
    <div className="bg-daami-cream border border-daami-gold/20 px-4 py-3 flex items-center gap-3 mb-6">
      <div className="relative w-12 h-14 shrink-0 overflow-hidden bg-white">
        <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-daami-black truncate">{product.name}</p>
        <p className="text-[11px] text-daami-gray mt-0.5">
          {selectedSize && `Size: ${selectedSize}`}{selectedColor && ` · ${selectedColor}`}{quantity > 1 && ` · Qty: ${quantity}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-daami-gold">{formatPrice(productTotal)}</p>
        {deliveryCharge > 0 && <p className="text-[10px] text-daami-gray">+{formatPrice(deliveryCharge)} delivery</p>}
      </div>
    </div>
  );

  // Price breakdown box
  const PriceBox = () => (
    <div className="bg-gray-50 border border-gray-200 px-4 py-3 space-y-1.5 text-xs">
      <div className="flex justify-between text-daami-gray">
        <span>Product × {quantity}</span>
        <span>{formatPrice(productTotal)}</span>
      </div>
      <div className="flex justify-between text-daami-gray">
        <span>Delivery charge</span>
        <span>{formatPrice(deliveryCharge)}</span>
      </div>
      <div className="flex justify-between font-bold text-daami-black border-t border-gray-200 pt-1.5">
        <span>Total</span>
        <span className="text-daami-gold">{formatPrice(grandTotal)}</span>
      </div>
    </div>
  );

  // ── Success ──
  if (step === 'done') return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check size={30} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-daami-black">Order Placed!</h3>
        <p className="text-sm text-daami-gray mt-2">Thank you! Your order is confirmed.</p>
        <p className="text-xs text-daami-gray mt-1">We'll contact you at {form.phone} soon.</p>
        <div className="bg-daami-cream p-4 mt-4 text-left text-xs space-y-1.5 rounded">
          <div className="flex justify-between text-daami-gray"><span>Product</span><span>{formatPrice(productTotal)}</span></div>
          <div className="flex justify-between text-daami-gray"><span>Delivery</span><span>{formatPrice(deliveryCharge)}</span></div>
          <div className="flex justify-between font-bold text-daami-black border-t border-daami-gold/20 pt-1.5">
            <span>Total Paid</span><span className="text-daami-gold">{formatPrice(grandTotal)}</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-gold w-full mt-6">Continue Shopping</button>
      </div>
    </div>
  );

  const headerTitle = {
    delivery: 'Choose Delivery',
    details: deliveryType === 'home' ? 'Home Delivery' : 'Courier Branch Pickup',
    payment: 'Payment',
  }[step];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <input ref={screenshotRef} type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-daami-black">{headerTitle}</h2>
          <button onClick={onClose} className="p-1.5 text-daami-gray hover:text-daami-black rounded"><X size={20} /></button>
        </div>

        <div className="px-6 py-5">
          <Summary />

          {/* ── Step 1: Choose Delivery Method ── */}
          {step === 'delivery' && (
            <div className="space-y-3">
              <p className="text-xs text-daami-gray -mt-2 mb-1">How would you like to receive your order?</p>

              <button
                onClick={() => { setDeliveryType('home'); setStep('details'); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-daami-gold hover:bg-daami-cream/40 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-full bg-daami-gold/10 group-hover:bg-daami-gold/20 flex items-center justify-center shrink-0">
                  <Truck size={20} className="text-daami-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-daami-black text-sm">Home Delivery</p>
                  <p className="text-xs text-daami-gray mt-0.5">Delivered to your doorstep</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] bg-daami-cream px-1.5 py-0.5 text-daami-dark-gray">Valley NPR 120</span>
                    <span className="text-[10px] bg-daami-cream px-1.5 py-0.5 text-daami-dark-gray">Major City NPR 200</span>
                    <span className="text-[10px] bg-daami-cream px-1.5 py-0.5 text-daami-dark-gray">Standard NPR 170</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-daami-gray shrink-0" />
              </button>

              <button
                onClick={() => { setDeliveryType('courier'); setStep('details'); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-daami-gold hover:bg-daami-cream/40 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-full bg-daami-gold/10 group-hover:bg-daami-gold/20 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-daami-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-daami-black text-sm">Courier Branch Pickup</p>
                  <p className="text-xs text-daami-gray mt-0.5">Pick up from nearest courier office</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] bg-daami-cream px-1.5 py-0.5 text-daami-dark-gray">Valley NPR 70</span>
                    <span className="text-[10px] bg-daami-cream px-1.5 py-0.5 text-daami-dark-gray">Major City NPR 150</span>
                    <span className="text-[10px] bg-daami-cream px-1.5 py-0.5 text-daami-dark-gray">Standard NPR 150</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-daami-gray shrink-0" />
              </button>
            </div>
          )}

          {/* ── Step 2: Delivery Details (shared for home + courier) ── */}
          {step === 'details' && (
            <div className="space-y-4">
              <Field name="name" label="Full Name *" placeholder="Your full name" value={form.name} onChange={handleChange} error={errors.name} />
              <Field name="phone" label="Phone Number *" placeholder="98XXXXXXXX" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} />

              {/* Searchable location input */}
              <div className="relative">
                <label className="block text-xs font-semibold text-daami-black mb-1.5">Location *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-daami-gray pointer-events-none" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => handleLocationSearch(e.target.value)}
                    placeholder="Type your city or area..."
                    className={`w-full border pl-9 pr-4 py-3 text-sm outline-none transition-colors ${errors.location ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-daami-gold'}`}
                  />
                </div>
                {errors.location && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {errors.location}</p>}
                {locationSuggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto mt-1">
                    {locationSuggestions.map(loc => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => selectLocation(loc)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-daami-cream transition-colors text-left"
                      >
                        <span className="font-medium text-daami-black">{loc.name}</span>
                        <span className="text-xs text-daami-gray shrink-0 ml-2">
                          {deliveryType === 'home' ? `NPR ${loc.home}` : `NPR ${loc.courier}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery charge banner — shows after location selected */}
              {form.location && (
                <>
                  <div className="flex items-center justify-between bg-daami-cream border border-daami-gold/30 px-4 py-2.5">
                    <span className="text-xs text-daami-gray flex items-center gap-1.5">
                      <MapPin size={11} />
                      {form.location} · {deliveryType === 'home' ? 'Home Delivery' : 'Courier Pickup'}
                    </span>
                    <span className="text-sm font-bold text-daami-gold">NPR {deliveryCharge}</span>
                  </div>
                  <PriceBox />
                </>
              )}

              {/* Home delivery: full address */}
              {deliveryType === 'home' && (
                <Field name="address" label="Full Address *" placeholder="Street, Tole, Landmark" value={form.address} onChange={handleChange} error={errors.address} />
              )}

              {/* Courier: branch (optional) */}
              {deliveryType === 'courier' && (
                <Field name="branch" label="Courier Branch (optional)" placeholder="e.g. New Road branch" value={form.branch} onChange={handleChange} error={errors.branch} />
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setStep('delivery'); setForm(f => ({ ...f, location: '' })); setLocationQuery(''); setLocationSuggestions([]); }} className="btn-secondary px-5">Back</button>
                <button onClick={() => { if (validateDetails()) setStep('payment'); }} className="btn-gold flex-1">Continue to Payment</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* QR */}
              <div className="flex flex-col items-center bg-gray-50 border border-gray-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-daami-gray mb-3">Scan to Pay</p>
                {qrCode ? (
                  <div className="bg-white p-3 border border-gray-200 shadow-sm">
                    <img src={qrCode} alt="Payment QR" width={180} height={180} className="block object-contain" style={{ width: 180, height: 180 }} />
                  </div>
                ) : (
                  <div className="w-[180px] h-[180px] bg-white border border-gray-200 flex items-center justify-center text-center p-4">
                    <p className="text-xs text-daami-gray">QR code not set up yet. Contact the store.</p>
                  </div>
                )}
                <div className="mt-3 text-center space-y-0.5">
                  <p className="text-xs text-daami-gray">
                    Product <span className="font-semibold text-daami-black">{formatPrice(productTotal)}</span>
                    {' + '}Delivery <span className="font-semibold text-daami-black">{formatPrice(deliveryCharge)}</span>
                  </p>
                  <p className="text-sm font-bold text-daami-gold">Total: {formatPrice(grandTotal)}</p>
                </div>
              </div>

              {/* Payment method select */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-daami-black">Payment Method *</p>
                {[
                  { id: 'online', label: 'Online Payment (QR)', sub: 'Pay via eSewa / Khalti / Bank transfer', icon: CreditCard },
                  { id: 'cod', label: 'Cash On Delivery', sub: 'Delivery charge should pay', icon: Banknote },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setPaymentMethod(m.id); setErrors(p => ({ ...p, payment: '' })); }}
                    className={`w-full flex items-center gap-3 p-3 border-2 transition-all text-left ${paymentMethod === m.id ? 'border-daami-gold bg-daami-cream' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <m.icon size={16} className="text-daami-gold shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium block">{m.label}</span>
                      <span className="text-[11px] text-daami-gray">{m.sub}</span>
                    </div>
                    {paymentMethod === m.id && <Check size={14} className="text-daami-gold shrink-0" />}
                  </button>
                ))}
                {errors.payment && <p className="flex items-center gap-1 text-red-500 text-xs"><AlertCircle size={11} /> {errors.payment}</p>}
              </div>

              <ScreenshotUpload
                screenshot={screenshot}
                setScreenshot={setScreenshot}
                screenshotRef={screenshotRef}
                screenshotUploading={screenshotUploading}
                error={errors.screenshot}
              />

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('details')} className="btn-secondary px-5">Back</button>
                <button onClick={handleSubmit} disabled={placing} className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                  {placing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {placing ? 'Confirming...' : `Confirm · ${formatPrice(grandTotal)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useLoginModal();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyError, setBuyError] = useState('');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.product) { router.replace('/404'); return; }
        const p = parse(data.product);
        setProduct(p);
        setSelectedColor(p.colors[0] || '');
        setSelectedImage(0);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!product) return;
    fetch(`/api/products?category=${product.category}`)
      .then(r => r.json())
      .then(data => {
        const list = (data.products || []).filter(p => p.id !== product.id).slice(0, 4).map(parse);
        setRelated(list);
      });
  }, [product]);

  if (loading) return (
    <div className="page-container py-20 flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Map each color to its corresponding image index
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const colorIdx = product.colors.indexOf(color);
    if (colorIdx !== -1 && product.images[colorIdx]) {
      setSelectedImage(colorIdx);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addToCart(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!selectedSize) {
      setSizeError(true);
      setBuyError('Please select a size first');
      setTimeout(() => setBuyError(''), 3000);
      return;
    }
    setSizeError(false);
    setBuyError('');
    setBuyModalOpen(true);
  };

  const COLOR_MAP = {
    white: '#f8f8f8', black: '#111111', red: '#dc2626', navy: '#1e3a5f',
    blue: '#3b82f6', green: '#16a34a', gray: '#6b7280', grey: '#6b7280',
    charcoal: '#374151', cream: '#f5f0e8', pink: '#ec4899', yellow: '#eab308',
    orange: '#f97316', purple: '#7c3aed', maroon: '#7f1d1d', olive: '#65611a',
    khaki: '#c3b091', brown: '#78350f', beige: '#d4b483', 'sky blue': '#0ea5e9',
    'ash gray': '#9ca3af', 'light gray': '#d1d5db', 'dark gray': '#374151',
    'cobalt blue': '#2563eb', 'sage green': '#6b8f5e', terracotta: '#c2694f',
  };

  const getColorHex = (name) => COLOR_MAP[name.toLowerCase()] || null;

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="page-container py-4">
        <nav className="flex items-center gap-2 text-xs text-daami-gray">
          <Link href="/" className="hover:text-daami-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-daami-gold transition-colors">Products</Link>
          <ChevronRight size={12} />
          <Link href={`/category/${product.category}`} className="hover:text-daami-gold transition-colors capitalize">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-daami-black font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="page-container pb-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Images ── */}
          <div className="flex gap-3">
            <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative aspect-square overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-daami-gold' : 'border-transparent'}`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>

            <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-daami-cream">
              <Image
                src={product.images[selectedImage] || product.images[0]}
                alt={`${product.name} — ${selectedColor}`}
                fill
                priority
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 ${
                    product.badge === 'Sale' ? 'bg-red-500 text-white' :
                    product.badge === 'New' ? 'bg-daami-gold text-daami-black' :
                    'bg-daami-black text-daami-gold'
                  }`}>{product.badge}</span>
                </div>
              )}
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="absolute top-4 right-4 w-10 h-10 bg-white shadow-md flex items-center justify-center hover:text-red-500 transition-colors"
              >
                <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} className={wishlisted ? 'text-red-500' : ''} />
              </button>
              <div className="sm:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {product.images.map((_, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === selectedImage ? 'bg-daami-gold w-4' : 'bg-white/60'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Details ── */}
          <div>
            <p className="text-xs uppercase tracking-widest text-daami-gray font-medium capitalize">{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-daami-black mt-1 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'text-daami-gold fill-current' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-sm text-daami-gray">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold text-daami-black">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-daami-gray line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5">-{discount}% OFF</span>
                </>
              )}
            </div>

            <p className="text-daami-dark-gray text-sm leading-relaxed mt-5">{product.description}</p>

            {/* ── Color Selection ── */}
            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-daami-black mb-3">
                  Color: <span className="font-normal text-daami-gray">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color, i) => {
                    const hex = getColorHex(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        title={color}
                        className={`group relative flex items-center gap-2 px-3 py-2 border-2 text-xs font-medium transition-all duration-200 ${
                          isSelected
                            ? 'border-daami-gold bg-daami-gold/10 text-daami-black'
                            : 'border-gray-200 hover:border-daami-gold text-daami-dark-gray'
                        }`}
                      >
                        {hex && (
                          <span
                            className={`w-4 h-4 rounded-full border inline-block shrink-0 ${hex === '#f8f8f8' ? 'border-gray-300' : 'border-transparent'}`}
                            style={{ backgroundColor: hex }}
                          />
                        )}
                        {color}
                        {isSelected && <Check size={12} className="text-daami-gold ml-0.5" />}
                        {/* Shows image index indicator if color has its own image */}
                        {product.images[i] && product.images.length > 1 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-daami-gold rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {product.images.length > 1 && (
                  <p className="text-[10px] text-daami-gray mt-2">● Each color has its own photo — click to preview</p>
                )}
              </div>
            )}

            {/* ── Size Selection ── */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <p className={`text-sm font-semibold ${sizeError ? 'text-red-500' : 'text-daami-black'}`}>
                  {sizeError ? '* Please select a size' : 'Size'}
                  {selectedSize && <span className="font-normal text-daami-gray">: {selectedSize}</span>}
                </p>
                <Link href="#" className="text-xs text-daami-gold underline underline-offset-2">Size Guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); setBuyError(''); }}
                    className={`min-w-[48px] px-3 py-2.5 text-xs font-medium border-2 transition-all duration-200 ${
                      selectedSize === size
                        ? 'border-daami-black bg-daami-black text-white'
                        : sizeError
                        ? 'border-red-300 hover:border-red-500 text-daami-dark-gray'
                        : 'border-gray-200 hover:border-daami-black text-daami-dark-gray'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {selectedSize === 'Freesize' && (
                <div className="mt-3 flex items-start gap-2.5 bg-daami-cream border border-daami-gold/30 px-4 py-3">
                  <span className="text-base leading-none mt-0.5">📏</span>
                  <div className="text-xs text-daami-dark-gray leading-relaxed">
                    <p className="font-semibold text-daami-black mb-0.5">Freesize — Fit Guide</p>
                    <p>⚖️ <span className="font-medium">Weight:</span> 48 kg to 80 kg</p>
                    <p>📐 <span className="font-medium">Height:</span> 5 ft to 5&apos;7&quot;</p>
                  </div>
                </div>
              )}
              {selectedSize === 'XL' && (
                <div className="mt-3 flex items-start gap-2.5 bg-daami-cream border border-daami-gold/30 px-4 py-3">
                  <span className="text-base leading-none mt-0.5">📏</span>
                  <div className="text-xs text-daami-dark-gray leading-relaxed">
                    <p className="font-semibold text-daami-black mb-0.5">XL — Fit Guide</p>
                    <p>⚖️ <span className="font-medium">Weight:</span> 70 kg to 100 kg</p>
                    <p>📐 <span className="font-medium">Height:</span> 5&apos;8&quot; to 6 ft</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Quantity ── */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center border-2 border-gray-200">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-daami-cream transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-daami-cream transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* ── CTAs ── */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                  added ? 'bg-green-600 text-white' : 'bg-daami-black text-white hover:bg-daami-gold hover:text-daami-black'
                }`}
              >
                {added ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </button>
              <button onClick={() => setWishlisted(!wishlisted)}
                className="w-14 h-14 border-2 border-gray-200 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors shrink-0">
                <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} className={wishlisted ? 'text-red-500' : ''} />
              </button>
              <button className="w-14 h-14 border-2 border-gray-200 flex items-center justify-center hover:border-daami-gold hover:text-daami-gold transition-colors shrink-0">
                <Share2 size={16} />
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              className="block w-full mt-3 btn-gold text-center py-4 text-sm font-semibold uppercase tracking-wide"
            >
              Buy Now
            </button>

            {buyError && (
              <p className="flex items-center gap-1.5 text-red-500 text-xs mt-2">
                <AlertCircle size={13} /> {buyError}
              </p>
            )}

            {/* ── Trust Signals ── */}
            <div className="grid grid-cols-3 gap-3 mt-7 pt-7 border-t border-gray-100">
              {[
                { icon: Truck, label: 'Delivery Time', sub: '2 - 4 days' },
                { icon: Shield, label: 'Secure Pay', sub: 'Multiple methods' },
                { icon: RefreshCw, label: 'No Exchange Or Cancellation', sub: 'All sales are final' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5">
                  <Icon size={18} className="text-daami-gold" />
                  <span className="text-xs font-semibold text-daami-black">{label}</span>
                  <span className="text-[10px] text-daami-gray">{sub}</span>
                </div>
              ))}
            </div>

            {/* ── Product Details ── */}
            <div className="mt-7 pt-7 border-t border-gray-100 space-y-2">
              {product.material && (
                <div className="flex gap-3 text-sm">
                  <span className="text-daami-gray w-24 shrink-0">Material</span>
                  <span className="text-daami-dark-gray">{product.material}</span>
                </div>
              )}
              {product.care && (
                <div className="flex gap-3 text-sm">
                  <span className="text-daami-gray w-24 shrink-0">Care</span>
                  <span className="text-daami-dark-gray">{product.care}</span>
                </div>
              )}
              <div className="flex gap-3 text-sm">
                <span className="text-daami-gray w-24 shrink-0">SKU</span>
                <span className="text-daami-dark-gray">DC-{product.id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-daami-black">You May Also Like</h2>
              <Link href={`/category/${product.category}`} className="text-sm text-daami-gold hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Buy Now Modal ── */}
      {buyModalOpen && (
        <BuyNowModal
          product={product}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          quantity={quantity}
          onClose={() => setBuyModalOpen(false)}
        />
      )}
    </div>
  );
}
