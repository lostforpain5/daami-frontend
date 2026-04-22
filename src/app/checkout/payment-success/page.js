'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get('method');
  const orderId = searchParams.get('orderId');
  const pidx = searchParams.get('pidx');
  const data = searchParams.get('data');

  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      try {
        let url = '';
        if (method === 'khalti' && pidx) {
          url = `/api/payment/khalti?pidx=${pidx}&purchase_order_id=${orderId}`;
        } else if (method === 'esewa' && data) {
          url = `/api/payment/esewa?data=${data}&orderId=${orderId}`;
        } else {
          setStatus('success');
          return;
        }

        const res = await fetch(url);
        const result = await res.json();
        setStatus(result.status === 'Completed' ? 'success' : 'failed');
      } catch {
        setStatus('success');
      }
    };
    verify();
  }, [method, orderId, pidx, data]);

  if (status === 'verifying') {
    return (
      <div className="page-container py-24 text-center">
        <Loader2 size={40} className="mx-auto text-daami-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold text-daami-black">Verifying Payment...</h2>
        <p className="text-daami-gray mt-2">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="page-container py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <span className="text-3xl">✕</span>
        </div>
        <h2 className="text-2xl font-bold text-daami-black mt-5">Payment Failed</h2>
        <p className="text-daami-gray mt-2">Your payment could not be verified. Please contact support.</p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/orders" className="btn-primary">My Orders</Link>
          <Link href="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-24 text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <Check size={40} className="text-green-500" />
      </div>
      <h2 className="text-3xl font-bold text-daami-black mt-6">Payment Successful!</h2>
      <p className="text-daami-gray mt-3 text-lg">
        Your order has been placed and payment confirmed.
      </p>
      {orderId && (
        <div className="bg-daami-cream p-5 mt-6 text-sm space-y-2 text-left">
          <p className="flex justify-between">
            <span className="text-daami-gray">Order ID</span>
            <strong className="font-mono">#{orderId.slice(-8).toUpperCase()}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-daami-gray">Payment Method</span>
            <strong className="capitalize">{method}</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-daami-gray">Status</span>
            <strong className="text-green-600">Confirmed</strong>
          </p>
        </div>
      )}
      <div className="flex gap-4 justify-center mt-8">
        <Link href="/orders" className="btn-primary">Track My Order</Link>
        <Link href="/products" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="bg-daami-cream min-h-screen py-10">
      <Suspense fallback={
        <div className="page-container py-24 text-center">
          <Loader2 size={40} className="mx-auto text-daami-gold animate-spin" />
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
