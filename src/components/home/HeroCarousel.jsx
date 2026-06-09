'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/data/products';

const GAP = 16; // matches Tailwind gap-4 — keep in sync with the track className

const parse = (p) => ({
  ...p,
  images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
  sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
  colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
  tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'),
});

// ─── Outer: loads products, then mounts the carousel with a stable item count ──
export default function HeroCarousel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setItems((data.products || []).map(parse).filter((p) => p.images[0]).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-daami-black py-8 md:py-12">
        <div className="page-container">
          <div className="mx-auto w-[80%] sm:w-[60%] lg:w-[46%] aspect-[16/10] rounded-2xl bg-white/5 animate-pulse" />
        </div>
      </section>
    );
  }
  if (items.length === 0) return null;

  return <Carousel items={items} />;
}

// ─── Inner: the PlayStation-style center-mode carousel ─────────────────────────
function Carousel({ items }) {
  const n = items.length;
  const loop = n > 1;
  // Clone last + first for a seamless infinite loop
  const slides = loop ? [items[n - 1], ...items, items[0]] : items;

  const [index, setIndex] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [offset, setOffset] = useState(0);

  const viewportRef = useRef(null);
  const slideRef = useRef(null);
  const pausedRef = useRef(false);
  const touchRef = useRef({ x: 0, dragging: false });

  // Center the active slide: viewport-center − half-slide − index*(slide+gap)
  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const slide = slideRef.current;
    if (!vp || !slide) return;
    const slideW = slide.offsetWidth;
    setOffset(vp.offsetWidth / 2 - slideW / 2 - index * (slideW + GAP));
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

  // Seamless wrap: after sliding onto a clone, jump (without animation) to the real slide
  const handleTransitionEnd = () => {
    if (!loop) return;
    if (index >= n + 1) { setAnimate(false); setIndex(1); }
    else if (index <= 0) { setAnimate(false); setIndex(n); }
  };

  // Re-enable animation on the frame after a no-animation jump
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  // Auto-play every 4s, paused on hover / touch
  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => { if (!pausedRef.current) next(); }, 4000);
    return () => clearInterval(id);
  }, [loop, next]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const onTouchStart = (e) => { pause(); touchRef.current = { x: e.touches[0].clientX, dragging: true }; };
  const onTouchEnd = (e) => {
    if (touchRef.current.dragging) {
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    }
    touchRef.current.dragging = false;
    resume();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  const realIndex = loop ? ((index - 1) % n + n) % n : index;

  return (
    <section
      className="bg-daami-black py-7 md:py-11"
      aria-roledescription="carousel"
      aria-label="Featured t-shirts"
    >
      <div className="relative page-container">
        {/* Viewport */}
        <div
          ref={viewportRef}
          className="overflow-hidden focus:outline-none"
          tabIndex={0}
          role="group"
          aria-label={`Slide ${realIndex + 1} of ${n}`}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onKeyDown={onKeyDown}
        >
          <div
            className="flex gap-4 will-change-transform"
            style={{
              transform: `translate3d(${offset}px,0,0)`,
              transition: animate ? 'transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((p, i) => {
              const active = i === index;
              return (
                <div
                  key={`${p.id}-${i}`}
                  ref={i === (loop ? 1 : 0) ? slideRef : null}
                  className="shrink-0 basis-[80%] sm:basis-[62%] lg:basis-[46%]"
                  aria-hidden={!active}
                >
                  <Link
                    href={`/products/${p.id}`}
                    tabIndex={active ? 0 : -1}
                    className={`group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-daami-cream transition-[transform,box-shadow,opacity] duration-500 ease-out ${
                      active
                        ? 'scale-100 opacity-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-daami-gold/30'
                        : 'scale-[0.88] opacity-50'
                    }`}
                  >
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      priority={i <= 2}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 62vw, 46vw"
                    />
                    {/* Bottom gradient + info (PS-store card style) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 md:p-6">
                      <h2 className="text-white font-bold text-base md:text-xl leading-tight line-clamp-1">{p.name}</h2>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="text-daami-gold font-bold text-sm md:text-lg">{formatPrice(p.price)}</span>
                        <span
                          className={`hidden sm:inline-flex items-center gap-2 bg-daami-gold text-daami-black text-xs md:text-sm font-bold px-4 py-2 rounded-full transition-opacity ${
                            active ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <ShoppingBag size={15} /> Buy Now
                        </span>
                      </div>
                    </div>
                  </Link>
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
              aria-label="Previous slide"
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-daami-gold backdrop-blur-sm border border-white/20 text-white hover:text-daami-black flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-daami-gold backdrop-blur-sm border border-white/20 text-white hover:text-daami-black flex items-center justify-center transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Pagination dots */}
        {loop && (
          <div className="flex items-center justify-center gap-2 mt-5" role="tablist" aria-label="Choose slide">
            {items.map((_, i) => {
              const isActive = i === realIndex;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive ? 'w-7 bg-daami-gold' : 'w-2 bg-white/30 hover:bg-white/60'
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
