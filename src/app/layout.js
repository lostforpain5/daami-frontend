import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { LoginModalProvider } from '@/context/LoginModalContext';
import { Toaster } from 'react-hot-toast';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: { default: 'Daami Clothing — Premium Fashion', template: '%s | Daami Clothing' },
  description: 'Discover premium clothing for men, women, and kids. Daami Clothing blends tradition with modern elegance.',
  keywords: ['Daami Clothing', 'fashion', 'ethnic wear', 'Nepal fashion', 'clothing brand'],
  openGraph: {
    title: 'Daami Clothing',
    description: 'Premium fashion for every occasion.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AuthProvider>
          <SettingsProvider>
          <CartProvider>
            <LoginModalProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', borderRadius: '2px' },
                success: { iconTheme: { primary: '#C9A84C', secondary: '#fff' } },
              }}
            />
            </LoginModalProvider>
          </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
