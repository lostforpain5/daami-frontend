'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [hovered, setHovered] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sizes = (product.sizes || []).filter(s => s !== 'XL');
    const defaultSize = sizes[Math.floor(sizes.length / 2)] || 'Freesize';
    addToCart(product, defaultSize, product.colors[0]);
  };

  return (
    <div
      className="group relative card-luxe"
      onMouseEnter={() => { setHovered(true); setImgIdx(1); }}
      onMouseLeave={() => { setHovered(false); setImgIdx(0); }}
    >
      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative overflow-hidden aspect-[3/4] bg-night-surface">
        <Image
          src={product.images[imgIdx] || product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${
              product.badge === 'Sale' ? 'bg-red-500 text-white' :
              product.badge === 'New' ? 'bg-daami-gold text-daami-black' :
              product.badge === 'Bestseller' ? 'bg-daami-black text-daami-gold' :
              'bg-daami-black text-white'
            }`}>
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2.5 py-1">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick Add overlay */}
        <div className={`absolute bottom-0 left-0 right-0 bg-daami-black/90 py-3 px-4 flex items-center justify-between transition-all duration-300 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            onClick={handleQuickAdd}
            className="flex items-center gap-2 text-white text-xs font-medium uppercase tracking-wider hover:text-daami-gold transition-colors"
          >
            <ShoppingBag size={14} /> Quick Add
          </button>
          <Link
            href={`/products/${product.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-white/60 text-xs hover:text-daami-gold transition-colors"
          >
            <Eye size={13} /> View
          </Link>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3 md:p-4">
        <Link href={`/products/${product.id}`} className="hover:text-luxe-gold transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-night-muted mb-1 font-medium">
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </p>
          <h3 className="text-sm font-semibold text-night-text leading-snug line-clamp-2">{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10} className={s <= Math.round(product.rating) ? 'text-luxe-gold fill-current' : 'text-white/15'} />
            ))}
          </div>
          <span className="text-[10px] text-night-muted">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-night-text">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-night-muted line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Buy Now — one click to the product page to complete the order */}
        <Link
          href={`/products/${product.id}`}
          className="btn-buy mt-3 w-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wide py-2.5 rounded-xl"
        >
          <ShoppingBag size={14} /> Buy Now
        </Link>
      </div>
    </div>
  );
}
