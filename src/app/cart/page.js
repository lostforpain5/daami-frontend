'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { formatPrice } from '@/data/products';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PROMO_CODES = { DAAMI10: 10, SAVE20: 20, WELCOME15: 15 };

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { freeShippingThreshold, shippingFee, khaltiEnabled, esewaEnabled, stripeEnabled, codEnabled } = useSettings();
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, discount: PROMO_CODES[code] });
      toast.success(`Promo code applied! ${PROMO_CODES[code]}% off`);
      setPromoInput('');
    } else {
      toast.error('Invalid promo code');
    }
  };

  const shipping = cartTotal >= freeShippingThreshold ? 0 : shippingFee;
  const discount = appliedPromo ? Math.round(cartTotal * appliedPromo.discount / 100) : 0;
  const total = cartTotal - discount + shipping;

  if (items.length === 0) {
    return (
      <div className="page-container py-24 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-daami-cream flex items-center justify-center mb-6">
          <ShoppingBag size={36} className="text-daami-gold" />
        </div>
        <h1 className="text-2xl font-bold text-daami-black">Your cart is empty</h1>
        <p className="text-daami-gray mt-2 max-w-sm">Looks like you haven't added anything yet. Explore our collections and find something you love.</p>
        <Link href="/products" className="btn-primary mt-8 flex items-center gap-2">
          Start Shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white py-10 md:py-14">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">Shopping Cart <span className="text-lg font-normal text-daami-gray ml-2">({items.length} item{items.length !== 1 ? 's' : ''})</span></h1>
          <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors">
            <Trash2 size={13} /> Clear All
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.key} className="flex gap-4 p-4 border border-gray-100 hover:border-daami-gold/30 transition-colors group">
                <Link href={`/products/${item.product.id}`} className="relative w-24 h-28 md:w-28 md:h-32 shrink-0 overflow-hidden bg-daami-cream">
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="112px"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/products/${item.product.id}`} className="text-sm font-semibold text-daami-black hover:text-daami-gold transition-colors leading-snug">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-daami-gray mt-1 capitalize">{item.product.category}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-daami-dark-gray bg-daami-cream px-2 py-0.5">Size: {item.size}</span>
                        <span className="text-xs text-daami-dark-gray bg-daami-cream px-2 py-0.5">{item.color}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-daami-cream transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-daami-cream transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-daami-black">{formatPrice(item.product.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-daami-gray">{formatPrice(item.product.price)} each</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <Link href="/products" className="flex items-center gap-2 text-sm text-daami-gold hover:text-daami-gold-dark font-medium mt-4 transition-colors">
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-daami-cream p-6 sticky top-24">
              <h2 className="text-lg font-bold text-daami-black mb-5">Order Summary</h2>

              {/* Promo Code */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-daami-dark-gray mb-2 flex items-center gap-1.5">
                  <Tag size={12} /> Promo Code
                </p>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 text-sm">
                    <span className="text-green-700 font-medium">{appliedPromo.code} — {appliedPromo.discount}% OFF</span>
                    <button onClick={() => setAppliedPromo(null)} className="text-red-500 text-xs">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-0">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="Enter code (e.g. DAAMI10)"
                      className="flex-1 input-field text-xs py-2.5"
                    />
                    <button onClick={applyPromo} className="bg-daami-black text-white px-4 text-xs font-semibold hover:bg-daami-gold hover:text-daami-black transition-colors">
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-daami-gray">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-daami-gray">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-daami-gold">{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-primary w-full text-center block mt-6 py-4 flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>

              <p className="text-[10px] text-center text-daami-gray mt-3">
                🔒 Secure checkout with SSL encryption
              </p>

              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {[
                  { label: 'Khalti', enabled: khaltiEnabled },
                  { label: 'eSewa', enabled: esewaEnabled },
                  { label: 'Stripe', enabled: stripeEnabled },
                  { label: 'COD', enabled: codEnabled },
                ].filter(m => m.enabled).map(m => (
                  <span key={m.label} className="text-[9px] border border-gray-200 px-2 py-0.5 text-daami-gray rounded">{m.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
