'use client';
import { MessageCircle, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { whatsappLink } from '@/data/store';

export default function ContactPage() {
  const { storeName, storeEmail, storePhone, storeAddress } = useSettings();

  const email = storeEmail || 'hello@daamiclothing.com';
  const phone = storePhone || '+977 9800000000';
  const address = storeAddress || 'New Road, Kathmandu, Nepal';

  return (
    <div className="bg-daami-cream min-h-screen">
      {/* Header */}
      <div className="bg-daami-black text-center py-12 md:py-16 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Contact Us</h1>
        <p className="text-white/60 mt-3 max-w-md mx-auto text-sm">
          Have a question or want to order? We&apos;re here to help — reach us the easy way.
        </p>
      </div>

      <div className="page-container py-10 md:py-14 max-w-2xl">
        {/* WhatsApp — primary, biggest action */}
        <a
          href={whatsappLink('Hello Daami Clothing! 👋 I have a question.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white text-base md:text-lg font-bold py-5 rounded-lg hover:bg-[#1da851] transition-colors shadow-sm"
        >
          <MessageCircle size={24} /> Chat with us on WhatsApp
        </a>
        <p className="text-center text-xs text-daami-gray mt-2">Fastest way to reach us — we usually reply within minutes.</p>

        {/* Other ways to reach us */}
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
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
