'use client';
import { Shield, RefreshCw, Headphones, Truck } from 'lucide-react';

const features = [
  { icon: Truck, title: 'Delivery Time', description: '2 - 4 days' },
  { icon: Shield, title: 'Secure Payment', description: 'Multiple payment options' },
  { icon: RefreshCw, title: 'No Exchange Or Cancellation', description: 'All sales are final' },
  { icon: Headphones, title: '24/7 Support', description: 'Dedicated customer care' },
];

export default function PromoSection() {
  return (
    <section className="py-10 md:py-14 bg-daami-black">
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-daami-gold/20 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-daami-gold" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">{title}</h4>
                <p className="text-white/50 text-xs mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
