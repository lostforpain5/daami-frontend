'use client';
import Link from 'next/link';
import { ShoppingBag, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function ContactPage() {
  const { storeName, storeEmail, storePhone, storeAddress } = useSettings();

  const email = storeEmail || 'hello@daamiclothing.com';
  const phone = storePhone || '+977 9766598459';
  const address = storeAddress || 'New Road, Kathmandu, Nepal';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="text-center pt-10 pb-6 md:pt-16 md:pb-10 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-daami-black">Contact Us</h1>
        <p className="text-daami-gray mt-3 max-w-md mx-auto text-sm">
          We&apos;re here to help.
        </p>
      </div>

      <div className="page-container py-10 md:py-14 max-w-2xl">
        {/* Order on the website — primary message */}
        <div className="bg-white rounded-lg p-6 md:p-8 text-center">
          <h2 className="text-xl font-bold text-daami-black">How to Order</h2>
          <p className="text-sm text-daami-gray mt-2 max-w-md mx-auto">
            Please place your order directly on our website — it only takes a few taps,
            and you don&apos;t need an account. Just pick a t-shirt and press <strong>Buy Now</strong>.
          </p>
          <Link
            href="/category/couple-tshirt"
            className="inline-flex items-center justify-center gap-2 mt-5 bg-daami-gold text-daami-black font-bold text-sm md:text-base px-8 py-3.5 rounded-full hover:bg-daami-black hover:text-white transition-colors"
          >
            <ShoppingBag size={18} /> Shop Now
          </Link>
        </div>

        {/* Reach us */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-start gap-3 bg-white p-5 rounded-lg hover:shadow-md transition-shadow">
            <Phone size={20} className="text-daami-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-daami-black">Call Us</p>
              <p className="text-sm text-daami-gray mt-0.5">{phone}</p>
            </div>
          </a>

          <a href={`mailto:${email}`} className="flex items-start gap-3 bg-white p-5 rounded-lg hover:shadow-md transition-shadow">
            <Mail size={20} className="text-daami-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-daami-black">Email Us</p>
              <p className="text-sm text-daami-gray mt-0.5 break-all">{email}</p>
            </div>
          </a>

          <div className="flex items-start gap-3 bg-white p-5 rounded-lg">
            <MapPin size={20} className="text-daami-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-daami-black">Visit Us</p>
              <p className="text-sm text-daami-gray mt-0.5">{address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-5 rounded-lg">
            <Clock size={20} className="text-daami-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-daami-black">Opening Hours</p>
              <p className="text-sm text-daami-gray mt-0.5">Sun – Fri, 10 AM – 7 PM</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-daami-gray mt-10">
          Thank you for shopping with <span className="font-semibold text-daami-black">{storeName || 'Daami Clothing'}</span> ❤️
        </p>
      </div>
    </div>
  );
}
