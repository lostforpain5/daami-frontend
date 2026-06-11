'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag, User, LogOut, Settings,
  ChevronDown, Search
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import AnnouncementBar from '@/components/layout/AnnouncementBar';

// ─── Simple, fixed navigation menu ──────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Boy Tshirt', href: '/category/boy-tshirt' },
  { label: 'Girl Tshirt', href: '/category/girl-tshirt' },
  { label: 'Couple Tshirt', href: '/category/couple-tshirt' },
  { label: 'Contact Us', href: '/contact' },
];

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { storeName } = useSettings();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);

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
    setUserMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Luxury bronze announcement bar */}
      <AnnouncementBar />

      <nav className={`sticky top-0 z-50 bg-[#0E0E10]/85 backdrop-blur-md transition-all duration-300 ${scrolled ? 'shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)] border-b border-white/5' : 'border-b border-white/10'}`}>
        <div className="page-container">
          <div className="relative flex items-center justify-center md:justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-center md:items-start group">
              <span className="font-display text-2xl md:text-3xl font-semibold tracking-[0.12em] text-night-text group-hover:text-luxe-gold transition-colors duration-200 uppercase">
                {storeName.split(' ')[0]}
              </span>
              <span className="text-[9px] tracking-[0.4em] text-luxe-gold/70 uppercase -mt-0.5 font-medium">
                {storeName.split(' ').slice(1).join(' ') || 'CLOTHING'}
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-7">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide uppercase hover:text-luxe-gold transition-colors duration-200 relative group ${
                    isActive(link.href) ? 'text-luxe-gold' : 'text-night-text'
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-luxe-gold transition-all duration-200 ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="absolute right-0 md:static flex items-center gap-1 md:gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:text-luxe-gold transition-colors text-night-text"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* User (optional login) */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-2 hover:text-luxe-gold transition-colors text-night-text"
                  >
                    <div className="w-7 h-7 rounded-full bg-luxe-gold flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={14} className={`hidden md:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link href="/auth/login" className="p-2 hover:text-luxe-gold transition-colors text-night-text block" aria-label="Account">
                    <User size={20} />
                  </Link>
                )}

                {userMenuOpen && isAuthenticated && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-night-surface shadow-xl border border-night-border py-2 animate-fade-in z-50 rounded-lg">
                    <div className="px-4 py-2 border-b border-night-border">
                      <p className="text-sm font-semibold text-night-text">{user.name}</p>
                      <p className="text-xs text-night-muted truncate">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-night-text hover:bg-white/5 hover:text-luxe-gold transition-colors">
                        <Settings size={15} /> Admin Panel
                      </Link>
                    )}
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-night-text hover:bg-white/5 hover:text-luxe-gold transition-colors">
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
              <Link href="/cart" className="relative p-2 hover:text-luxe-gold transition-colors text-night-text">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-luxe-gold text-white text-[10px] font-bold min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center leading-none px-1">
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
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-night-muted" />
                <input
                  type="text"
                  placeholder="Search t-shirts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-night-border focus:outline-none focus:border-luxe-gold text-sm bg-night-surface text-night-text placeholder-night-muted"
                />
              </form>
            </div>
          )}
        </div>

        {/* Mobile collection nav — always visible under the logo (replaces hamburger) */}
        <div className="md:hidden border-t border-white/10 bg-night-base/40">
          <div className="page-container">
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto scrollbar-none py-2.5">
              {NAV_LINKS.filter((link) => link.href.startsWith('/category/')).map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200 border ${
                      active
                        ? 'text-white border-transparent shadow-[0_4px_14px_-3px_rgba(201,160,99,0.45)]'
                        : 'text-luxe-gold border-luxe-gold/30 hover:border-luxe-gold/60'
                    }`}
                    style={{
                      backgroundImage: active
                        ? 'linear-gradient(135deg, #9C5F3D, #C9A063)'
                        : 'linear-gradient(135deg, #1F2024, #17181B)',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
