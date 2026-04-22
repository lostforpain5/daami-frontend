'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Star, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes[Math.floor(product.sizes.length / 2)];
    addToCart(product, defaultSize, product.colors[0]);
  };

  return (
    <div
      className="group relative bg-white card-hover"
      onMouseEnter={() => { setHovered(true); setImgIdx(1); }}
      onMouseLeave={() => { setHovered(false); setImgIdx(0); }}
    >
      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative overflow-hidden aspect-[3/4] bg-daami-cream">
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

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWishlisted(!wishlisted); }}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 ${
            hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          } ${wishlisted ? 'text-red-500' : 'text-daami-gray hover:text-red-500'}`}
          aria-label="Wishlist"
        >
          <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

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
        <Link href={`/products/${product.id}`} className="hover:text-daami-gold transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-daami-gray mb-1 font-medium">
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </p>
          <h3 className="text-sm font-semibold text-daami-black leading-snug line-clamp-2">{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10} className={s <= Math.round(product.rating) ? 'text-daami-gold fill-current' : 'text-gray-300'} />
            ))}
          </div>
          <span className="text-[10px] text-daami-gray">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-daami-black">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-daami-gray line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Color dots */}
        <div className="flex items-center gap-1 mt-2">
          {product.colors.slice(0, 4).map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-full border border-gray-200 bg-gray-300" title={color} />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-daami-gray">+{product.colors.length - 4}</span>
          )}
        </div>
      </div>
    </div>
  );
}
