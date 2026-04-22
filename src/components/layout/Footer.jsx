'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '@/context/SettingsContext';

const footerLinks = {
  shop: [
    { label: 'Men', href: '/category/men' },
    { label: 'Women', href: '/category/women' },
    { label: 'Couple T-Shirts', href: '/category/couple-tshirts' },
    { label: 'Hoodies', href: '/category/hoodies' },
    { label: 'New Arrivals', href: '/category/new-arrivals' },
    { label: 'Trending', href: '/category/trending' },
    { label: 'All Products', href: '/products' },
  ],
  help: [
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Shipping & Returns', href: '/shipping' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Track Order', href: '/orders' },
  ],
  company: [
    { label: 'About Daami', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const { storeName, storeEmail, storePhone, storeAddress, khaltiEnabled, esewaEnabled, stripeEnabled, codEnabled } = useSettings();

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    toast.success('Subscribed! Thank you for joining Daami family!');
    setEmail('');
  };

  return (
    <footer className="bg-daami-black text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="page-container py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Join the Daami Family</h3>
              <p className="text-white/60 mt-2 text-sm">Get exclusive deals, style tips, and early access to new collections.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full md:w-auto gap-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 md:w-80 px-5 py-3.5 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-daami-gold transition-colors"
              />
              <button type="submit" className="bg-daami-gold text-daami-black px-6 py-3.5 font-semibold text-sm hover:bg-daami-gold-light transition-colors flex items-center gap-2 whitespace-nowrap">
                Subscribe <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex flex-col items-start group">
              <span className="text-3xl font-bold tracking-[0.15em] text-white group-hover:text-daami-gold transition-colors uppercase">DAAMI</span>
              <span className="text-[9px] tracking-[0.4em] text-white/50 uppercase -mt-1 font-medium">CLOTHING</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mt-5 max-w-xs">
              Redefining South Asian fashion with modern designs rooted in tradition.
              Quality clothing for every moment, every occasion.
            </p>
            <div className="flex items-center gap-2 mt-6 flex-wrap">
              {[
                { label: 'IG', full: 'Instagram', href: '#' },
                { label: 'FB', full: 'Facebook', href: '#' },
                { label: 'YT', full: 'YouTube', href: '#' },
                { label: 'X',  full: 'Twitter / X', href: '#' },
              ].map(({ label, full, href }) => (
                <a key={label} href={href} aria-label={full}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 text-[11px] font-bold hover:border-daami-gold hover:text-daami-gold transition-colors">
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-6 space-y-2.5">
              {storeEmail && (
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Mail size={14} className="text-daami-gold shrink-0" />
                  <span>{storeEmail}</span>
                </div>
              )}
              {storePhone && (
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Phone size={14} className="text-daami-gold shrink-0" />
                  <span>{storePhone}</span>
                </div>
              )}
              {storeAddress && (
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MapPin size={14} className="text-daami-gold shrink-0" />
                  <span>{storeAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Shop', links: footerLinks.shop },
            { title: 'Help', links: footerLinks.help },
            { title: 'Company', links: footerLinks.company },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold tracking-widest uppercase text-daami-gold mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-white/60 text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} {storeName}. All rights reserved. Made with ❤️ in Nepal.
          </p>
          <div className="flex items-center gap-2 text-white/40 text-xs flex-wrap">
            {khaltiEnabled && <span className="border border-white/20 px-2 py-0.5 rounded text-[10px]">Khalti</span>}
            {esewaEnabled && <span className="border border-white/20 px-2 py-0.5 rounded text-[10px]">eSewa</span>}
            {stripeEnabled && <span className="border border-white/20 px-2 py-0.5 rounded text-[10px]">Stripe</span>}
            {codEnabled && <span className="border border-white/20 px-2 py-0.5 rounded text-[10px]">COD</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
