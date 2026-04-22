'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="page-container py-24 text-center max-w-lg mx-auto">
      <XCircle size={64} className="mx-auto text-red-400 mb-6" />
      <h2 className="text-3xl font-bold text-daami-black">Payment Failed</h2>
      <p className="text-daami-gray mt-3 text-lg">
        Your payment was not completed. No charges have been made.
      </p>
      {orderId && (
        <div className="bg-daami-cream p-5 mt-6 text-sm">
          <p className="text-daami-gray">Order reference: <strong className="font-mono text-daami-black">#{orderId.slice(-8).toUpperCase()}</strong></p>
          <p className="text-daami-gray mt-1">You can retry payment from your orders page.</p>
        </div>
      )}
      <div className="flex gap-4 justify-center mt-8">
        <Link href="/checkout" className="btn-primary">Try Again</Link>
        <Link href="/orders" className="btn-secondary">My Orders</Link>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <div className="bg-daami-cream min-h-screen py-10">
      <Suspense fallback={<div className="page-container py-24 text-center">Loading...</div>}>
        <PaymentFailedContent />
      </Suspense>
    </div>
  );
}
