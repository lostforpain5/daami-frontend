'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function FrontendShell({ children }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
