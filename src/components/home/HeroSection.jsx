'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK = [
  {
    id: 'fallback',
    tag: 'New Collection',
    title: 'Wear Your\nStory',
    subtitle: 'Discover premium clothing that blends modern style with everyday comfort.',
    cta: 'Shop Now',
    ctaHref: '/products',
    secondaryCta: 'Explore All',
    secondaryHref: '/products',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop',
    align: 'left',
  },
];

export default function HeroSection() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetch('/api/banners')
      .then(r => r.json())
      .then(data => {
        const active = (data.banners || []).filter(b => b.active);
        setSlides(active.length > 0 ? active : FALLBACK);
      })
      .catch(() => setSlides(FALLBACK));
  }, []);

  const goTo = (idx) => {
    if (animating || slides.length <= 1) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 600);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  if (slides.length === 0) {
    return <section className="h-[70vh] md:h-[85vh] bg-daami-black" />;
  }

  const slide = slides[current];

  return (
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden bg-daami-black">
      {/* Background Images */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {s.image && (
            <Image
              src={s.image}
              alt={s.title}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          )}
          <div className={`absolute inset-0 ${s.align === 'right' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/80 via-black/50 to-transparent`} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full page-container flex items-center">
        <div className={`max-w-xl ${slide.align === 'right' ? 'ml-auto text-right' : ''} ${animating ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
          {slide.tag && (
            <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase mb-4 text-daami-gold">
              {slide.tag}
            </span>
          )}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight whitespace-pre-line">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-white/70 text-base md:text-lg mt-5 leading-relaxed max-w-sm">
              {slide.subtitle}
            </p>
          )}
          <div className={`flex items-center gap-4 mt-8 ${slide.align === 'right' ? 'justify-end' : ''}`}>
            <Link href={slide.ctaHref || '/products'} className="btn-gold flex items-center gap-2 group">
              {slide.cta || 'Shop Now'}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {slide.secondaryCta && (
              <Link href={slide.secondaryHref || '/products'} className="text-white/80 text-sm font-medium tracking-wide uppercase hover:text-daami-gold transition-colors flex items-center gap-1.5">
                {slide.secondaryCta} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows — only if multiple slides */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-daami-gold hover:border-daami-gold hover:text-daami-black transition-all duration-200">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-daami-gold hover:border-daami-gold hover:text-daami-black transition-all duration-200">
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${i === current ? 'w-8 h-2 bg-daami-gold' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 hidden md:flex">
        <div className="page-container">
          <div className="flex items-stretch divide-x divide-white/10 bg-daami-black/60 backdrop-blur-sm w-fit">
            {[
              { value: '500+', label: 'Products' },
              { value: '10K+', label: 'Happy Customers' },
              { value: '5★', label: 'Avg Rating' },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 py-3 flex flex-col items-center">
                <span className="text-daami-gold font-bold text-lg leading-none">{value}</span>
                <span className="text-white/60 text-[10px] uppercase tracking-wider mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
