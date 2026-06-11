'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/data/products';

const DRAG_CLICK_THRESHOLD = 8; // px before a press counts as a drag (suppresses click)
const SNAP_FRACTION = 0.18;     // how far you must drag (in slide-steps) to change slide
const WINDOW = 2;               // render only the active slide ±2 for performance

// Normalize a DB/static product so arrays are real arrays (shape the rest of the app expects).
const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

// Trending = exactly the products the admin tags "trending" (managed in /admin/trending).
const selectTrending = (list) => list.filter((p) => p.tags.includes('trending')).slice(0, 12);

// ─── Outer: loads products, then mounts the carousel with a stable item count ──
export default function TrendingCarousel({ initialItems }) {
  const [items, setItems] = useState(initialItems || []);
  const [loading, setLoading] = useState(!initialItems);

  useEffect(() => {
    if (initialItems) return; // server already provided the data
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setItems(selectTrending((data.products || []).map(parse))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialItems]);

  if (loading) {
    return (
      <section className="bg-transparent py-12 md:py-16">
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

function SectionHeading() {
  return (
    <div className="text-center mb-2 md:mb-10">
      <span className="collection-label hidden md:inline-block">Featured Collection</span>
      <h2 className="luxe-heading mt-0 md:mt-2.5 text-2xl md:text-5xl font-semibold tracking-tight">Trending Couple T-Shirts</h2>
      <p className="mt-1.5 hidden md:block text-luxe-muted text-base tracking-wide">Swipe or drag to explore the collection</p>
    </div>
  );
}

// ─── Inner: PlayStation Store-style coverflow (manual only — no autoplay/arrows) ──
function Carousel({ items }) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);            // fractional slide offset while dragging
  const [dims, setDims] = useState({ slideW: 0, boxH: 0, stepPx: 0 });
  const [detailVisible, setDetailVisible] = useState(true);

  const viewportRef = useRef(null);
  const ptr = useRef({ active: false, startX: 0, moved: 0, id: null });

  // Measure responsive sizes: center image width, its height (4:5), and the side step.
  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const frac = w < 640 ? 0.74 : w < 1024 ? 0.64 : 0.56;
    const slideW = Math.round(w * frac);
    const ratio = w < 640 ? 1.08 : 1.25;          // shorter on mobile so the Buy Now button sits higher
    const boxH = Math.round(slideW * ratio);
    const stepPx = Math.round(slideW * 0.6);      // sides sit close, tucked behind center
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

  // Fade the details (opacity only — never moves) when the active product changes.
  useEffect(() => {
    setDetailVisible(false);
    const id = requestAnimationFrame(() => setDetailVisible(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  const goNext = useCallback(() => setActive((a) => (a + 1) % n), [n]);
  const goPrev = useCallback(() => setActive((a) => (a - 1 + n) % n), [n]);

  // Shortest signed distance from active on the ring → enables seamless infinite loop.
  const half = Math.floor(n / 2);
  const circDist = (i) => {
    let d = (((i - active) % n) + n) % n;
    if (d > half) d -= n;
    return d;
  };

  // ── Unified pointer drag (mouse + touch) ──
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

  // Click handling per slide: drag → cancel; side image → select; center → open product page.
  const onSlideClick = (e, i) => {
    if (ptr.current.moved > DRAG_CLICK_THRESHOLD) { e.preventDefault(); return; }
    if (i !== active) { e.preventDefault(); setActive(i); }
  };

  const dragging = ptr.current.active;
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
          className="relative mx-auto w-full max-w-4xl overflow-hidden select-none focus:outline-none [&_img]:pointer-events-none"
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
            if (Math.abs(d) > WINDOW) return null;     // only render the visible window
            const pos = d + drag;                      // continuous position incl. live drag
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
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    priority={isCenter}
                    sizes="(max-width: 640px) 74vw, (max-width: 1024px) 64vw, 56vw"
                    className={`object-cover transition-transform duration-700 ${isCenter ? 'scale-[1.03] group-hover:scale-105' : ''}`}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pagination dots — directly below the image */}
        <div className="flex items-center justify-center gap-2 mt-3 md:mt-6" role="tablist" aria-label="Choose product">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to product ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? 'w-8 bg-luxe-gold' : 'w-2 bg-white/25 hover:bg-luxe-gold/60'
              }`}
            />
          ))}
        </div>

        {/* Fixed details — never moves; only content swaps (opacity fade) on slide change */}
        <div className="mt-3 md:mt-8 mx-auto max-w-xl text-center min-h-[150px] md:min-h-[230px]">
          <div className={`transition-opacity duration-300 ${detailVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Category — hidden on mobile to keep Buy Now above the fold */}
            <p className="hidden md:block collection-label">
              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </p>
            <Link href={`/products/${product.id}`} className="block transition-colors hover:text-luxe-gold">
              {/* Fixed height (reserves 2 lines) so the button never shifts; long names truncate */}
              <div className="mt-0 md:mt-2 flex items-center justify-center h-[52px] md:h-[96px]">
                <h3 className="luxe-heading text-[24px] md:text-[42px] font-semibold leading-tight line-clamp-2">
                  {product.name}
                </h3>
              </div>
            </Link>

            {/* Rating — hidden on mobile to keep Buy Now above the fold */}
            <div className="hidden md:flex items-center justify-center gap-1.5 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= Math.round(product.rating) ? 'text-luxe-gold fill-current' : 'text-white/20'}
                  />
                ))}
              </div>
              <span className="text-xs text-luxe-muted">({product.reviews})</span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-center gap-2.5 mt-2 md:mt-3.5">
              <span className="text-xl md:text-2xl font-bold text-night-text">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-night-muted line-through">{formatPrice(product.originalPrice)}</span>
              )}
              {discount && (
                <span className="text-[11px] font-bold bg-luxe-gold text-night-base px-2 py-0.5 rounded">-{discount}%</span>
              )}
            </div>

            {/* Place Order — opens the delivery details panel directly */}
            <Link
              href={`/products/${product.id}?order=1`}
              className="btn-luxe mt-3 md:mt-6 px-10 text-sm uppercase"
            >
              <ShoppingBag size={16} /> Place Order
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
