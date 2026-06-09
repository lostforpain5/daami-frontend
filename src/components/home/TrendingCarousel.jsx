'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

const GAP = 20; // px gap between slides — keep in sync with the track's gap-5 class
const AUTOPLAY_MS = 4500;
const DRAG_CLICK_THRESHOLD = 8; // px of movement before a press counts as a drag (suppresses click)

// Normalize a DB/static product so arrays are real arrays (same shape ProductCard expects).
const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

// Pick the trending couple t-shirts, with graceful fallbacks so the rail is never empty.
const isCouple = (p) =>
  p.category === 'couple-tshirts' || /couple/i.test(p.category || '') || p.tags.includes('couple');

const selectTrendingCouple = (list) => {
  const couple = list.filter(isCouple);
  const trendingCouple = couple.filter((p) => p.tags.includes('trending'));
  let picked =
    trendingCouple.length >= 3 ? trendingCouple :
    couple.length >= 3 ? couple :
    list.filter((p) => p.tags.includes('trending'));
  if (picked.length < 3) picked = list;
  return picked.slice(0, 12);
};

// ─── Outer: loads products, then mounts the carousel with a stable item count ──
export default function TrendingCarousel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setItems(selectTrendingCouple((data.products || []).map(parse))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-12 md:py-16">
        <div className="page-container">
          <SectionHeading />
          <div className="flex justify-center gap-5">
            <div className="hidden lg:block w-[30%] aspect-[3/4] rounded-lg bg-gray-100 animate-pulse opacity-60" />
            <div className="w-[80%] sm:w-[55%] md:w-[40%] lg:w-[30%] aspect-[3/4] rounded-lg bg-gray-100 animate-pulse" />
            <div className="hidden lg:block w-[30%] aspect-[3/4] rounded-lg bg-gray-100 animate-pulse opacity-60" />
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
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 md:mb-10">
      <div>
        <span className="text-xs font-semibold tracking-[0.3em] uppercase text-daami-gold">Featured Collection</span>
        <h2 className="section-title mt-2">Trending Couple T-Shirts</h2>
        <p className="section-subtitle mt-1">Slide through the collection — tap any design to shop</p>
      </div>
      <Link
        href="/category/couple-tshirts"
        className="flex items-center gap-2 text-sm font-medium text-daami-black hover:text-daami-gold transition-colors group shrink-0"
      >
        View All <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

// ─── Inner: the PlayStation-style center-mode carousel ─────────────────────────
function Carousel({ items }) {
  const n = items.length;
  const loop = n > 1;
  // Clone last + first for a seamless infinite loop.
  const slides = loop ? [items[n - 1], ...items, items[0]] : items;

  const [index, setIndex] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [baseOffset, setBaseOffset] = useState(0);
  const [dragPx, setDragPx] = useState(0);

  const viewportRef = useRef(null);
  const slideRef = useRef(null);
  const pausedRef = useRef(false);
  const drag = useRef({ active: false, startX: 0, moved: 0, pointerId: null });
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Center the active slide: viewport-center − half-slide − index*(slide+gap)
  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const slide = slideRef.current;
    if (!vp || !slide) return;
    const slideW = slide.offsetWidth;
    setBaseOffset(vp.offsetWidth / 2 - slideW / 2 - index * (slideW + GAP));
  }, [index]);

  useEffect(() => { measure(); }, [measure]);

  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const next = useCallback(() => setIndex((i) => i + 1), []);
  const prev = useCallback(() => setIndex((i) => i - 1), []);
  const goTo = useCallback((real) => setIndex(loop ? real + 1 : real), [loop]);

  // Seamless wrap: after sliding onto a clone, jump (without animation) to the real slide.
  const handleTransitionEnd = () => {
    if (!loop) return;
    if (index >= n + 1) { setAnimate(false); setIndex(1); }
    else if (index <= 0) { setAnimate(false); setIndex(n); }
  };

  // Re-enable animation on the frame after a no-animation jump.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  // Auto-play, paused on hover / drag / hidden tab / reduced-motion.
  useEffect(() => {
    if (!loop || reducedMotion.current) return;
    const id = setInterval(() => {
      if (!pausedRef.current && !document.hidden) next();
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [loop, next]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  // ── Unified pointer drag (mouse + touch) ──
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return; // primary button only
    drag.current = { active: true, startX: e.clientX, moved: 0, pointerId: e.pointerId };
    pause();
    setAnimate(false);
    viewportRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    setDragPx(dx);
  };

  const endDrag = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const slideW = slideRef.current?.offsetWidth || 1;
    const threshold = Math.min(slideW * 0.18, 80);
    drag.current.active = false;
    setDragPx(0);
    setAnimate(true);
    if (dx <= -threshold) next();
    else if (dx >= threshold) prev();
    resume();
    if (drag.current.pointerId != null)
      viewportRef.current?.releasePointerCapture?.(drag.current.pointerId);
  };

  // Swallow the click that follows a real drag so cards don't navigate mid-swipe.
  const onClickCapture = (e) => {
    if (drag.current.moved > DRAG_CLICK_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  const realIndex = loop ? (((index - 1) % n) + n) % n : index;

  return (
    <section className="bg-white py-12 md:py-16" aria-roledescription="carousel" aria-label="Trending couple t-shirts">
      <div className="page-container">
        <SectionHeading />

        <div className="relative">
          {/* Viewport */}
          <div
            ref={viewportRef}
            className="overflow-hidden focus:outline-none select-none"
            style={{ touchAction: 'pan-y' }}
            tabIndex={0}
            role="group"
            aria-label={`Slide ${realIndex + 1} of ${n}`}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            onDragStart={(e) => e.preventDefault()}
            onKeyDown={onKeyDown}
          >
            <div
              className="flex gap-5 will-change-transform [&_img]:pointer-events-none"
              style={{
                transform: `translate3d(${baseOffset + dragPx}px,0,0)`,
                transition: animate && !drag.current.active
                  ? 'transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)'
                  : 'none',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {slides.map((p, i) => {
                const active = i === index;
                return (
                  <div
                    key={`${p.id}-${i}`}
                    ref={i === (loop ? 1 : 0) ? slideRef : null}
                    aria-hidden={!active}
                    className="shrink-0 basis-[80%] sm:basis-[55%] md:basis-[40%] lg:basis-[31%] xl:basis-[26%]"
                  >
                    <div
                      className={`transition-[transform,opacity,filter] duration-500 ease-out ${
                        active
                          ? 'scale-100 opacity-100'
                          : 'scale-[0.86] opacity-55 blur-[1px] pointer-events-none'
                      }`}
                    >
                      <div className={active ? 'rounded-lg ring-1 ring-daami-gold/30 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.45)]' : ''}>
                        <ProductCard product={p} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrows */}
          {loop && (
            <>
              <button
                onClick={prev}
                aria-label="Previous product"
                className="absolute left-1 md:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-daami-black/80 hover:bg-daami-gold backdrop-blur-sm text-white hover:text-daami-black flex items-center justify-center shadow-lg transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={next}
                aria-label="Next product"
                className="absolute right-1 md:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-daami-black/80 hover:bg-daami-gold backdrop-blur-sm text-white hover:text-daami-black flex items-center justify-center shadow-lg transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>

        {/* Pagination dots */}
        {loop && (
          <div className="flex items-center justify-center gap-2 mt-7" role="tablist" aria-label="Choose product">
            {items.map((_, i) => {
              const isActive = i === realIndex;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to product ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive ? 'w-7 bg-daami-gold' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
