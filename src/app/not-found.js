import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <p className="text-8xl font-bold text-daami-gold">404</p>
      <h2 className="text-2xl font-bold text-daami-black mt-4">Page Not Found</h2>
      <p className="text-daami-gray mt-2 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-4 mt-8">
        <Link href="/" className="btn-primary">Go Home</Link>
        <Link href="/products" className="btn-secondary">Browse Products</Link>
      </div>
    </div>
  );
}
