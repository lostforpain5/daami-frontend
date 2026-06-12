'use client';
import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star, Heart, ShoppingBag, Shield, Truck, RefreshCw,
  ChevronRight, Minus, Plus, Share2, Check, X, CreditCard, Banknote, AlertCircle, Loader2, ImagePlus, MapPin
} from 'lucide-react';
import { formatPrice } from '@/data/products';
import { searchLocations, getDeliveryCharge } from '@/data/delivery';
import { useCart } from '@/context/CartContext';
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
      <label className="block text-xs font-semibold text-night-text mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border px-4 py-3 text-sm outline-none transition-colors rounded-lg ${error ? 'border-red-400 bg-red-500/10 text-night-text' : 'border-white/10 bg-[#1C1D21] text-night-text placeholder-night-muted focus:border-luxe-gold'}`}
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
      <p className="text-xs font-semibold text-night-text mb-2">Payment Screenshot *</p>
      {!screenshot ? (
        <button
          type="button"
          onClick={() => screenshotRef.current?.click()}
          disabled={screenshotUploading}
          className={`w-full rounded-lg border-2 border-dashed py-5 px-4 flex flex-col items-center gap-2 transition-colors disabled:opacity-60 ${error ? 'border-red-400 bg-red-500/10' : 'border-white/15 hover:border-luxe-gold hover:bg-white/5'}`}
        >
          {screenshotUploading ? <Loader2 size={22} className="animate-spin text-luxe-gold" /> : <ImagePlus size={22} className={error ? 'text-red-400' : 'text-night-muted'} />}
          <span className={`text-sm font-medium ${error ? 'text-red-500' : 'text-night-text'}`}>
            {screenshotUploading ? 'Uploading...' : 'Please Upload your payment screenshot'}
          </span>
          <span className="text-[11px] text-night-muted">Tap to choose image from your phone or gallery</span>
        </button>
      ) : (
        <div className="border border-green-500/25 bg-green-500/10 p-3 rounded-lg">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic blob/upload URL */}
            <img src={screenshot} alt="Payment screenshot" className="w-16 h-16 object-cover border border-white/10 rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-400 flex items-center gap-1"><Check size={12} /> Screenshot uploaded</p>
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
  // step: details | payment | done
  const [step, setStep] = useState('details');
  const [deliveryType, setDeliveryType] = useState('home'); // home | courier
  const [paymentMethod, setPaymentMethod] = useState(''); // online | cod
  const [form, setForm] = useState({ name: '', phone: '', address: '', location: '', version: 'Couple Tshirt', color: 'Black' });
  const TSHIRT_VERSIONS = ['Couple Tshirt', 'Boy Single Tshirt', 'Girl Single Tshirt'];
  // Single tees have fixed prices; Couple uses the product's listed price.
  const VERSION_PRICE = { 'Boy Single Tshirt': 850, 'Girl Single Tshirt': 750 };
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const screenshotRef = useRef(null);

  // Build an order of multiple t-shirts (couple + singles), each with its own colour & qty.
  const VERSIONS = [
    { name: 'Couple Tshirt', price: product.price },
    { name: 'Boy Single Tshirt', price: 850 },
    { name: 'Girl Single Tshirt', price: 750 },
  ];
  const priceOf = (v) => VERSIONS.find((x) => x.name === v)?.price ?? product.price;
  const [lines, setLines] = useState([{ version: 'Couple Tshirt', qty: quantity || 1 }]);
  const setLine = (idx, key, val) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [key]: val } : l)));
  const bumpQty = (idx, d) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, qty: Math.max(1, l.qty + d) } : l)));
  const addLine = () => setLines((ls) => [...ls, { version: 'Boy Single Tshirt', qty: 1 }]);
  const removeLine = (idx) => setLines((ls) => ls.filter((_, i) => i !== idx));
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const productTotal = lines.reduce((s, l) => s + priceOf(l.version) * l.qty, 0);
  const deliveryCharge = form.location ? getDeliveryCharge(form.location, deliveryType) : 0;
  const grandTotal = productTotal + deliveryCharge;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    if (lines.length === 0 || totalQty < 1) e.items = 'Add at least one t-shirt';
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
        deliveryType: deliveryType === 'home' ? 'Home Delivery' : 'Courier Branch',
        address: form.address,
      };
      const itemsSummary = lines.map((l) => `${l.version} ×${l.qty}`).join(', ');

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: product.id, name: `${product.name} — ${l.version}`, price: priceOf(l.version), quantity: l.qty, size: selectedSize || 'Freesize', color: '' })),
          shipping: deliveryCharge,
          address: addressData,
          notes: `Items: ${itemsSummary} | ${paymentMethod === 'online' ? 'Online Payment (QR)' : 'Cash On Delivery'} | Screenshot: ${screenshot}`,
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
    <div className="bg-[#1C1D21] border border-white/10 px-4 py-3 flex items-center gap-3 mb-6 rounded-lg">
      <div className="relative w-12 h-14 shrink-0 overflow-hidden rounded bg-night-surface">
        <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-night-text truncate">{product.name}</p>
        <p className="text-[11px] text-night-muted mt-0.5">
          {selectedSize ? `Size: ${selectedSize} · ` : ''}{lines.map((l) => `${l.version.replace(' Tshirt', '')} ×${l.qty}`).join(', ')}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-luxe-gold">{formatPrice(productTotal)}</p>
        {deliveryCharge > 0 && <p className="text-[10px] text-night-muted">+{formatPrice(deliveryCharge)} delivery</p>}
      </div>
    </div>
  );

  // Price breakdown box
  const PriceBox = () => (
    <div className="bg-[#1C1D21] border border-white/10 px-4 py-3 space-y-1.5 text-xs rounded-lg">
      <div className="flex justify-between text-night-muted">
        <span>Product × {totalQty}</span>
        <span>{formatPrice(productTotal)}</span>
      </div>
      <div className="flex justify-between text-night-muted">
        <span>Delivery charge</span>
        <span>{formatPrice(deliveryCharge)}</span>
      </div>
      <div className="flex justify-between font-bold text-night-text border-t border-white/10 pt-1.5">
        <span>Total</span>
        <span className="text-luxe-gold">{formatPrice(grandTotal)}</span>
      </div>
    </div>
  );

  // ── Success ──
  if (step === 'done') return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#141417] border border-white/10 w-full max-w-sm p-8 text-center shadow-2xl rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
          <Check size={30} className="text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-night-text">Order Placed!</h3>
        <p className="text-sm text-night-muted mt-2">Thank you! Your order is confirmed.</p>
        <p className="text-xs text-night-muted mt-1">We'll contact you at {form.phone} soon.</p>
        <div className="bg-[#1C1D21] border border-white/10 p-4 mt-4 text-left text-xs space-y-1.5 rounded-lg">
          <div className="flex justify-between text-night-muted"><span>Product</span><span>{formatPrice(productTotal)}</span></div>
          <div className="flex justify-between text-night-muted"><span>Delivery</span><span>{formatPrice(deliveryCharge)}</span></div>
          <div className="flex justify-between font-bold text-night-text border-t border-white/10 pt-1.5">
            <span>Total Paid</span><span className="text-luxe-gold">{formatPrice(grandTotal)}</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-buy w-full mt-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide">Continue Shopping</button>
      </div>
    </div>
  );

  const headerTitle = {
    details: 'Your Delivery Details',
    payment: 'Payment',
  }[step];

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex justify-center" onClick={onClose}>
      <div className="bg-[#141417] w-full sm:max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <input ref={screenshotRef} type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#141417] z-10">
          <h2 className="text-base font-bold text-night-text">{headerTitle}</h2>
          <button onClick={onClose} className="p-1.5 text-night-muted hover:text-night-text rounded"><X size={20} /></button>
        </div>

        <div className="px-6 py-5">
          <Summary />

          {/* Freesize details */}
          {selectedSize === 'Freesize' && (
            <div className="-mt-3 mb-6 overflow-hidden rounded-xl border border-luxe-gold/25 bg-[#1C1D21]">
              <div className="bg-gradient-to-r from-[#9C5F3D] to-[#C9A063] px-4 py-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-white">Freesize</p>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-stretch gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xl">📐</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-night-muted font-semibold">Height</p>
                      <p className="text-sm font-bold text-night-text">5ft – 5ft 8in</p>
                    </div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xl">⚖️</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-night-muted font-semibold">Weight</p>
                      <p className="text-sm font-bold text-night-text">50 – 85 kg</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Delivery Details ── */}
          {step === 'details' && (
            <div className="space-y-4">
              {/* Build your order — couple tee + single tees, any colours & quantities */}
              <div>
                <label className="block text-xs font-semibold text-night-text mb-1.5">Your T-Shirts *</label>
                <div className="space-y-3">
                  {lines.map((l, idx) => (
                    <div key={idx} className="rounded-lg border border-white/10 bg-[#1C1D21] p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-night-muted">Item {idx + 1}</span>
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)} className="text-red-400 text-[11px] font-semibold hover:underline">Remove</button>
                        )}
                      </div>
                      {/* Version */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {VERSIONS.map((v) => (
                          <button key={v.name} type="button" onClick={() => setLine(idx, 'version', v.name)}
                            className={`py-2 px-1 rounded-lg border text-[11px] font-bold leading-tight text-center transition-all ${
                              l.version === v.name
                                ? 'border-transparent text-white bg-gradient-to-br from-[#9C5F3D] to-[#C9A063]'
                                : 'border-white/12 text-night-text hover:border-luxe-gold/60'
                            }`}>
                            {v.name.replace(' Tshirt', '')}
                            <span className="block font-normal text-[10px] opacity-80 mt-0.5">{formatPrice(v.price)}</span>
                          </button>
                        ))}
                      </div>
                      {/* Quantity */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-night-muted">Quantity</span>
                        <div className="inline-flex items-center rounded-lg border border-white/12 overflow-hidden">
                          <button type="button" aria-label="Decrease" onClick={() => bumpQty(idx, -1)} className="w-9 h-9 flex items-center justify-center text-night-text hover:bg-white/5"><Minus size={14} /></button>
                          <span className="w-9 text-center text-sm font-bold text-night-text">{l.qty}</span>
                          <button type="button" aria-label="Increase" onClick={() => bumpQty(idx, 1)} className="w-9 h-9 flex items-center justify-center text-night-text hover:bg-white/5"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLine}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-luxe-gold/40 text-luxe-gold text-xs font-semibold py-2.5 hover:bg-luxe-gold/10 transition-colors">
                  <Plus size={14} /> Add another t-shirt
                </button>
                <p className="text-[11px] text-night-muted mt-2">Total: {totalQty} item{totalQty !== 1 ? 's' : ''}</p>
              </div>

              <Field name="name" label="Full Name *" placeholder="Your full name" value={form.name} onChange={handleChange} error={errors.name} />
              <Field name="phone" label="Phone Number *" placeholder="98XXXXXXXX" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} />

              {/* Searchable location input */}
              <div className="relative">
                <label className="block text-xs font-semibold text-night-text mb-1.5">Location *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-night-muted pointer-events-none" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => handleLocationSearch(e.target.value)}
                    placeholder="Type your city or area..."
                    className={`w-full border pl-9 pr-4 py-3 text-sm outline-none transition-colors rounded-lg ${errors.location ? 'border-red-400 bg-red-500/10 text-night-text' : 'border-white/10 bg-[#1C1D21] text-night-text placeholder-night-muted focus:border-luxe-gold'}`}
                  />
                </div>
                {errors.location && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {errors.location}</p>}
                {locationSuggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-[#1C1D21] border border-white/10 shadow-lg max-h-48 overflow-y-auto mt-1 rounded-lg">
                    {locationSuggestions.map(loc => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => selectLocation(loc)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="font-medium text-night-text">{loc.name}</span>
                        <span className="text-xs text-night-muted shrink-0 ml-2">NPR {loc.home}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Estimated delivery time */}
              <div className="flex items-center gap-2 text-xs font-medium text-night-text">
                <Truck size={14} className="text-luxe-gold" />
                Delivery Time: <span className="font-bold">2-3 days</span>
              </div>

              {/* Delivery options — each shows its own rate for the selected location */}
              {form.location && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-night-text mb-1.5">Delivery Option *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'home', label: 'Home Delivery', sub: 'To your address' },
                        { id: 'courier', label: 'Courier Branch', sub: 'Pickup from branch' },
                      ].map(opt => {
                        const charge = getDeliveryCharge(form.location, opt.id);
                        const selected = deliveryType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDeliveryType(opt.id)}
                            className={`flex flex-col items-start gap-0.5 p-3 border-2 rounded-lg text-left transition-all ${
                              selected ? 'border-luxe-gold bg-luxe-gold/10' : 'border-white/12 hover:border-white/25'
                            }`}
                          >
                            <span className="text-sm font-semibold text-night-text">{opt.label}</span>
                            <span className="text-[11px] text-night-muted">{opt.sub}</span>
                            <span className="text-sm font-bold text-luxe-gold mt-0.5">NPR {charge}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <PriceBox />
                </>
              )}

              {/* Full delivery address */}
              <Field name="address" label="Full Address *" placeholder="Street, Tole, Landmark" value={form.address} onChange={handleChange} error={errors.address} />

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="px-5 rounded-lg border border-white/15 text-night-text text-sm font-medium uppercase tracking-wide hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => { if (validateDetails()) setStep('payment'); }} className="btn-buy flex-1 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide">Continue to Payment</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* QR */}
              <div className="flex flex-col items-center bg-[#1C1D21] border border-white/10 p-5 rounded-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-night-muted mb-3">Scan to Pay</p>
                {qrCode ? (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-set QR URL */}
                    <img src={qrCode} alt="Payment QR" width={180} height={180} className="block object-contain" style={{ width: 180, height: 180 }} />
                  </div>
                ) : (
                  <div className="w-[180px] h-[180px] bg-night-base border border-white/10 rounded-lg flex items-center justify-center text-center p-4">
                    <p className="text-xs text-night-muted">QR code not set up yet. Contact the store.</p>
                  </div>
                )}
                <div className="mt-3 text-center space-y-0.5">
                  <p className="text-xs text-night-muted">
                    Product <span className="font-semibold text-night-text">{formatPrice(productTotal)}</span>
                    {' + '}Delivery <span className="font-semibold text-night-text">{formatPrice(deliveryCharge)}</span>
                  </p>
                  <p className="text-sm font-bold text-luxe-gold">Total: {formatPrice(grandTotal)}</p>
                </div>
              </div>

              {/* Payment method select */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-night-text">Payment Method *</p>
                {[
                  { id: 'online', label: 'Online Payment (QR)', sub: 'Pay via eSewa / Khalti / Bank transfer', icon: CreditCard },
                  { id: 'cod', label: 'Cash On Delivery', sub: 'Delivery charge should pay', icon: Banknote },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setPaymentMethod(m.id); setErrors(p => ({ ...p, payment: '' })); }}
                    className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-all text-left text-night-text ${paymentMethod === m.id ? 'border-luxe-gold bg-luxe-gold/10' : 'border-white/12 hover:border-white/25'}`}
                  >
                    <m.icon size={16} className="text-luxe-gold shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium block">{m.label}</span>
                      <span className="text-[11px] text-night-muted">{m.sub}</span>
                    </div>
                    {paymentMethod === m.id && <Check size={14} className="text-luxe-gold shrink-0" />}
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
                <button onClick={() => setStep('details')} className="px-5 rounded-lg border border-white/15 text-night-text text-sm font-medium uppercase tracking-wide hover:bg-white/5 transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={placing} className="btn-buy flex-1 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60">
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
        // Only Freesize is offered site-wide — drop XL and auto-select the lone size.
        const sizes = (p.sizes || []).filter(s => s !== 'XL');
        setSelectedSize(sizes.length === 1 ? sizes[0] : '');
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

  // Deep-link: "?order=1" (e.g. Place Order in the homepage carousel) opens the
  // delivery details panel directly, defaulting size/colour so checkout is one tap.
  useEffect(() => {
    if (!product) return;
    const wantsOrder = new URLSearchParams(window.location.search).get('order') === '1';
    if (!wantsOrder) return;
    const sizes = (product.sizes || []).filter(s => s !== 'XL');
    setSelectedSize(prev => prev || sizes[Math.floor(sizes.length / 2)] || 'Freesize');
    setSelectedColor(prev => prev || product.colors[0] || '');
    setBuyModalOpen(true);
    window.history.replaceState({}, '', `/products/${product.id}`); // clean the URL so refresh won't reopen
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
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addToCart(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
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
    <div>
      {/* Breadcrumb */}
      <div className="page-container py-4">
        <nav className="flex items-center gap-2 text-xs text-night-muted">
          <Link href="/" className="hover:text-daami-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-daami-gold transition-colors">Products</Link>
          <ChevronRight size={12} />
          <Link href={`/category/${product.category}`} className="hover:text-daami-gold transition-colors capitalize">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-night-text font-medium truncate max-w-[200px]">{product.name}</span>
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

            <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-night-surface">
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
            <p className="text-xs uppercase tracking-widest text-night-muted font-medium capitalize">{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-night-text mt-1 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'text-luxe-gold fill-current' : 'text-white/15'} />
                ))}
              </div>
              <span className="text-sm text-night-muted">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold text-night-text">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-night-muted line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="text-sm font-semibold text-red-400 bg-red-500/15 px-2 py-0.5">-{discount}% OFF</span>
                </>
              )}
            </div>

            <p className="text-night-muted text-sm leading-relaxed mt-5">{product.description}</p>

            {/* ── Color Selection ── */}
            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-night-text mb-3">
                  Color: <span className="font-normal text-night-muted">{selectedColor}</span>
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
                            ? 'border-luxe-gold bg-luxe-gold/10 text-night-text'
                            : 'border-white/15 hover:border-luxe-gold text-night-muted'
                        }`}
                      >
                        {hex && (
                          <span
                            className={`w-4 h-4 rounded-full border inline-block shrink-0 ${hex === '#f8f8f8' ? 'border-white/20' : 'border-transparent'}`}
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
                  <p className="text-[10px] text-night-muted mt-2">● Each color has its own photo — click to preview</p>
                )}
              </div>
            )}

            {/* ── Size Selection ── */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <p className={`text-sm font-semibold ${sizeError ? 'text-red-500' : 'text-night-text'}`}>
                  {sizeError ? '* Please select a size' : 'Size'}
                  {selectedSize && <span className="font-normal text-night-muted">: {selectedSize}</span>}
                </p>
                <Link href="#" className="text-xs text-daami-gold underline underline-offset-2">Size Guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.filter(s => s !== 'XL').map(size => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); setBuyError(''); }}
                    className={`min-w-[48px] px-3 py-2.5 text-xs font-medium border-2 transition-all duration-200 ${
                      selectedSize === size
                        ? 'border-luxe-gold bg-luxe-gold/15 text-night-text'
                        : sizeError
                        ? 'border-red-300 hover:border-red-500 text-night-muted'
                        : 'border-white/15 hover:border-luxe-gold text-night-muted'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {selectedSize === 'Freesize' && (
                <div className="mt-3 flex items-start gap-2.5 bg-[#1C1D21] border border-luxe-gold/30 rounded-lg px-4 py-3">
                  <span className="text-base leading-none mt-0.5">📏</span>
                  <div className="text-xs text-night-muted leading-relaxed">
                    <p className="font-semibold text-night-text mb-0.5">Freesize — Fit Guide</p>
                    <p>⚖️ <span className="font-medium">Weight:</span> 48 kg to 80 kg</p>
                    <p>📐 <span className="font-medium">Height:</span> 5 ft to 5&apos;7&quot;</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Quantity ── */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center border-2 border-white/15">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${product.inStock ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* ── CTAs ── */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                  added ? 'bg-green-600 text-white' : 'bg-white/5 border border-white/15 text-night-text hover:bg-luxe-gold hover:text-night-base hover:border-transparent'
                }`}
              >
                {added ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </button>
              <button onClick={() => setWishlisted(!wishlisted)}
                className="w-14 h-14 border-2 border-white/15 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors shrink-0">
                <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} className={wishlisted ? 'text-red-500' : ''} />
              </button>
              <button className="w-14 h-14 border-2 border-white/15 flex items-center justify-center hover:border-daami-gold hover:text-daami-gold transition-colors shrink-0">
                <Share2 size={16} />
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              className="btn-buy block w-full mt-3 text-center py-4 text-sm font-semibold uppercase tracking-wide rounded-xl"
            >
              Buy Now
            </button>

            {buyError && (
              <p className="flex items-center gap-1.5 text-red-500 text-xs mt-2">
                <AlertCircle size={13} /> {buyError}
              </p>
            )}

            {/* ── Trust Signals ── */}
            <div className="grid grid-cols-3 gap-3 mt-7 pt-7 border-t border-white/10">
              {[
                { icon: Truck, label: 'Delivery Time', sub: '2 - 4 days' },
                { icon: Shield, label: 'Secure Pay', sub: 'Multiple methods' },
                { icon: RefreshCw, label: 'No Exchange Or Cancellation', sub: 'All sales are final' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5">
                  <Icon size={18} className="text-daami-gold" />
                  <span className="text-xs font-semibold text-night-text">{label}</span>
                  <span className="text-[10px] text-night-muted">{sub}</span>
                </div>
              ))}
            </div>

            {/* ── Product Details ── */}
            <div className="mt-7 pt-7 border-t border-white/10 space-y-2">
              {product.material && (
                <div className="flex gap-3 text-sm">
                  <span className="text-night-muted w-24 shrink-0">Material</span>
                  <span className="text-night-muted">{product.material}</span>
                </div>
              )}
              {product.care && (
                <div className="flex gap-3 text-sm">
                  <span className="text-night-muted w-24 shrink-0">Care</span>
                  <span className="text-night-muted">{product.care}</span>
                </div>
              )}
              <div className="flex gap-3 text-sm">
                <span className="text-night-muted w-24 shrink-0">SKU</span>
                <span className="text-night-muted">DC-{product.id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-night-text">You May Also Like</h2>
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
