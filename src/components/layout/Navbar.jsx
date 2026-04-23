'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag, Menu, X, User, LogOut, Settings,
  ChevronDown, Search, Heart
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { storeName } = useSettings();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navLinks, setNavLinks] = useState([]);
  const userMenuRef = useRef(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        const links = (data.categories || []).map(c => ({
          label: c.label,
          href: `/category/${c.slug}`,
        }));
        setNavLinks(links);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Scrolling announcement bar */}
      <div className="bg-daami-black text-daami-gold text-[11px] py-2 overflow-hidden whitespace-nowrap relative">
        <div className="flex animate-marquee">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 items-center">
              <span className="mx-8 tracking-widest uppercase font-medium">New Collection Out Now</span>
              <span className="mx-2 text-daami-gold/40">|</span>
              <span className="mx-8 tracking-widest uppercase font-medium">Free Shipping Above Rs. 3000</span>
              <span className="mx-2 text-daami-gold/40">|</span>
              <span className="mx-8 tracking-widest uppercase font-medium">Premium Quality Clothing</span>
              <span className="mx-2 text-daami-gold/40">|</span>
              <span className="mx-8 tracking-widest uppercase font-medium">Shop The Latest Arrivals</span>
              <span className="mx-2 text-daami-gold/40">|</span>
            </div>
          ))}
        </div>
      </div>

      <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
        <div className="page-container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-daami-black"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex flex-col items-center md:items-start group">
              <span className="text-2xl md:text-3xl font-bold tracking-[0.15em] text-daami-black group-hover:text-daami-gold transition-colors duration-200 uppercase">
                {storeName.split(' ')[0]}
              </span>
              <span className="text-[9px] tracking-[0.4em] text-daami-gray uppercase -mt-1 font-medium">
                {storeName.split(' ').slice(1).join(' ') || 'CLOTHING'}
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide uppercase hover:text-daami-gold transition-colors duration-200 relative group ${
                    pathname === link.href ? 'text-daami-gold' : 'text-daami-black'
                  }`}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-daami-gold group-hover:w-full transition-all duration-200" />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:text-daami-gold transition-colors text-daami-black"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <button className="hidden md:flex p-2 hover:text-daami-gold transition-colors text-daami-black" aria-label="Wishlist">
                <Heart size={20} />
              </button>

              {/* User */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-2 hover:text-daami-gold transition-colors text-daami-black"
                  >
                    <div className="w-7 h-7 rounded-full bg-daami-gold flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={14} className={`hidden md:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link href="/auth/login" className="p-2 hover:text-daami-gold transition-colors text-daami-black block">
                    <User size={20} />
                  </Link>
                )}

                {userMenuOpen && isAuthenticated && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-daami-black">{user.name}</p>
                      <p className="text-xs text-daami-gray truncate">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-daami-cream hover:text-daami-gold transition-colors">
                        <Settings size={15} /> Admin Panel
                      </Link>
                    )}
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-daami-cream hover:text-daami-gold transition-colors">
                      <ShoppingBag size={15} /> My Orders
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm w-full hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 hover:text-daami-gold transition-colors text-daami-black">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-daami-gold text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search Bar (expandable) */}
          {searchOpen && (
            <div className="pb-4 animate-slide-up">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                className="relative"
              >
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-daami-gray" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 focus:outline-none focus:border-daami-gold text-sm bg-daami-cream"
                />
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-slide-up">
            <div className="page-container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3 px-2 text-sm font-medium uppercase tracking-wider border-b border-gray-50 hover:text-daami-gold transition-colors ${
                    pathname === link.href ? 'text-daami-gold' : 'text-daami-black'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="flex gap-3 mt-4 pt-2">
                  <Link href="/auth/login" className="flex-1 btn-primary text-center text-xs py-2.5">
                    Login
                  </Link>
                  <Link href="/auth/register" className="flex-1 btn-secondary text-center text-xs py-2.5">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
