'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/data/products';

const DRAG_CLICK_THRESHOLD = 8;
const SNAP_FRACTION = 0.18;
const WINDOW = 2;

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

// Trending = exactly the products the admin tags "trending" (managed in /admin/trending).
const selectTrending = (list) => list.filter((p) => p.tags.includes('trending')).slice(0, 12);

function SectionHeading() {
  return (
    <div className="text-center mb-4 md:mb-10">
      <span className="collection-label hidden md:inline-block">Featured Collection</span>
      <h2 className="font-sans mt-0 md:mt-2 text-2xl md:text-3xl font-semibold text-night-text">Trending Couple T-Shirts</h2>
      <p className="mt-1.5 hidden md:block text-luxe-muted text-base tracking-wide">Swipe or drag to explore the collection</p>
    </div>
  );
}

// ─── Outer: loads products, then mounts the carousel ───────────────────────────
export default function TrendingCarousel({ initialItems }) {
  const [items, setItems] = useState(initialItems || []);
  const [loading, setLoading] = useState(!initialItems);

  useEffect(() => {
    if (initialItems) return;
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setItems(selectTrending((data.products || []).map(parse))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialItems]);

  if (loading) {
    return (
      <section className="bg-transparent py-3 md:py-16">
        <div className="page-container">
          <SectionHeading />
          <div className="flex items-center justify-center gap-4">
            <div className="hidden sm:block w-[18%] aspect-[4/5] rounded-xl bg-white/5 animate-pulse opacity-50" />
            <div className="w-[62%] sm:w-[58%] aspect-[4/5] rounded-xl bg-white/5 animate-pulse" />
            <div className="hidden sm:block w-[18%] aspect-[4/5] rounded-xl bg-white/5 animate-pulse opacity-50" />
          </div>
        </div>
      </section>
    );
  }
  if (items.length === 0) return null;

  return <Carousel items={items} />;
}

// ─── Inner: PlayStation Store-style coverflow (manual only — no autoplay/arrows) ──
function Carousel({ items }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dims, setDims] = useState({ slideW: 0, boxH: 0, stepPx: 0 });
  const [detailVisible, setDetailVisible] = useState(true);
  const [showBack, setShowBack] = useState(false); // flip front/back on the active shirt

  const viewportRef = useRef(null);
  const ptr = useRef({ active: false, startX: 0, moved: 0, id: null });

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const frac = w < 640 ? 0.74 : w < 1024 ? 0.64 : 0.56;
    const slideW = Math.round(w * frac);
    const ratio = w < 640 ? 1.25 : 1.32;          // tall portrait image
    const boxH = Math.round(slideW * ratio);
    const stepPx = Math.round(slideW * 0.6);
    setDims({ slideW, boxH, stepPx });
  }, []);

  useEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    setShowBack(false); // each new shirt starts on its front image
    setDetailVisible(false);
    const id = requestAnimationFrame(() => setDetailVisible(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  // Auto-alternate front/back on the active shirt (only when it has a back image).
  useEffect(() => {
    if (!(items[active]?.images?.length > 1)) return;
    const id = setInterval(() => setShowBack((b) => !b), 1800);
    return () => clearInterval(id);
  }, [active, items]);

  const goNext = useCallback(() => setActive((a) => (a + 1) % n), [n]);
  const goPrev = useCallback(() => setActive((a) => (a - 1 + n) % n), [n]);

  const half = Math.floor(n / 2);
  const circDist = (i) => {
    let d = (((i - active) % n) + n) % n;
    if (d > half) d -= n;
    return d;
  };

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    ptr.current = { active: true, startX: e.clientX, moved: 0, id: e.pointerId };
    viewportRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!ptr.current.active) return;
    const dx = e.clientX - ptr.current.startX;
    ptr.current.moved = Math.max(ptr.current.moved, Math.abs(dx));
    const frac = dims.stepPx ? dx / dims.stepPx : 0;
    setDrag(Math.max(-1.2, Math.min(1.2, frac)));
  };
  const endDrag = (e) => {
    if (!ptr.current.active) return;
    const dx = e.clientX - ptr.current.startX;
    const frac = dims.stepPx ? dx / dims.stepPx : 0;
    ptr.current.active = false;
    setDrag(0);
    if (frac <= -SNAP_FRACTION) goNext();
    else if (frac >= SNAP_FRACTION) goPrev();
    if (ptr.current.id != null) viewportRef.current?.releasePointerCapture?.(ptr.current.id);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
  };

  const onSlideClick = (e, i) => {
    if (ptr.current.moved > DRAG_CLICK_THRESHOLD) { e.preventDefault(); return; }
    if (i !== active) { e.preventDefault(); setActive(i); }
    // Centre slide: let the click open the product page (front/back auto-alternates).
  };

  const dragging = ptr.current.active;
  const realIndex = ((active % n) + n) % n;
  const product = items[active];
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <section className="bg-transparent py-3 md:py-16" aria-roledescription="carousel" aria-label="Trending couple t-shirts">
      <div className="page-container">
        <SectionHeading />

        {/* Stage */}
        <div
          ref={viewportRef}
          className="relative isolate mx-auto w-full max-w-4xl overflow-hidden select-none focus:outline-none [&_img]:pointer-events-none"
          style={{ height: dims.boxH || undefined, touchAction: 'pan-y' }}
          tabIndex={0}
          role="group"
          aria-label={`Product ${active + 1} of ${n}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDragStart={(e) => e.preventDefault()}
          onKeyDown={onKeyDown}
        >
          {items.map((p, i) => {
            const d = circDist(i);
            if (Math.abs(d) > WINDOW) return null;
            const pos = d + drag;
            const ap = Math.abs(pos);
            const isCenter = ap < 0.5;
            const scale = Math.max(0.7, 1 - 0.16 * ap);
            const opacity = ap < 0.6 ? 1 : ap < 1.4 ? 0.6 : 0.28;
            const blurPx = ap < 0.5 ? 0 : Math.min(6, ap * 3.5);
            const z = 100 - Math.round(ap * 10);
            return (
              <div
                key={p.id}
                aria-hidden={!isCenter}
                className="absolute top-0 left-1/2"
                style={{
                  width: dims.slideW,
                  height: dims.boxH,
                  zIndex: z,
                  opacity,
                  filter: blurPx ? `blur(${blurPx}px)` : 'none',
                  transform: `translate3d(calc(-50% + ${pos * dims.stepPx}px),0,0) scale(${scale})`,
                  transition: dragging
                    ? 'none'
                    : 'transform 0.55s cubic-bezier(0.22,0.61,0.36,1), opacity 0.55s ease, filter 0.55s ease',
                  willChange: 'transform, opacity, filter',
                }}
              >
                <Link
                  href={`/products/${p.id}`}
                  tabIndex={isCenter ? 0 : -1}
                  aria-label={isCenter ? `Open ${p.name}` : `View ${p.name}`}
                  onClick={(e) => onSlideClick(e, i)}
                  className={`group relative block w-full h-full overflow-hidden rounded-[24px] bg-night-surface ${
                    isCenter ? 'ring-1 ring-luxe-gold/40 shadow-[0_34px_70px_-24px_rgba(0,0,0,0.8)]' : 'shadow-[0_18px_40px_-22px_rgba(0,0,0,0.7)]'
                  }`}
                >
                  {/* Front image */}
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    priority={isCenter}
                    sizes="(max-width: 640px) 74vw, (max-width: 1024px) 64vw, 56vw"
                    className={`object-cover transition-transform duration-700 ${isCenter ? 'scale-[1.03] group-hover:scale-105' : ''}`}
                  />
                  {/* Back image — auto cross-fades on the active shirt */}
                  {isCenter && p.images[1] && (
                    <Image
                      src={p.images[1]}
                      alt={`${p.name} — back`}
                      fill
                      sizes="(max-width: 640px) 74vw, (max-width: 1024px) 64vw, 56vw"
                      className={`object-cover scale-[1.03] group-hover:scale-105 transition-opacity duration-500 ${showBack ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-2 md:mt-6" role="tablist" aria-label="Choose product">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === realIndex}
              aria-label={`Go to product ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === realIndex ? 'w-8 bg-luxe-gold' : 'w-2 bg-white/25 hover:bg-luxe-gold/60'
              }`}
            />
          ))}
        </div>

        {/* Fixed details — never moves; only content swaps (opacity fade) on slide change */}
        <div className="mt-1.5 md:mt-8 mx-auto max-w-xl text-center min-h-[120px] md:min-h-[230px]">
          <div className={`transition-opacity duration-300 ${detailVisible ? 'opacity-100' : 'opacity-0'}`}>
            <p className="hidden md:block collection-label">
              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </p>
            <Link href={`/products/${product.id}`} className="block transition-colors hover:text-luxe-gold">
              <div className="mt-0 md:mt-2 flex items-center justify-center h-[40px] md:h-[76px]">
                <h3 className="font-sans text-lg md:text-2xl font-semibold text-night-text leading-tight line-clamp-2">
                  {product.name}
                </h3>
              </div>
            </Link>

            <div className="hidden md:flex items-center justify-center gap-1.5 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'text-luxe-gold fill-current' : 'text-white/20'} />
                ))}
              </div>
              <span className="text-xs text-luxe-muted">({product.reviews})</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-2 md:mt-3.5">
              <span className="text-xl md:text-2xl font-bold text-night-text">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-night-muted line-through">{formatPrice(product.originalPrice)}</span>
              )}
              {discount && (
                <span className="text-[11px] font-bold bg-luxe-gold text-night-base px-2 py-0.5 rounded">-{discount}%</span>
              )}
            </div>

            <Link
              href={`/products/${product.id}?order=1`}
              className="btn-luxe mt-2.5 md:mt-6 px-10 text-sm uppercase"
            >
              <ShoppingBag size={16} /> Place Order
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
