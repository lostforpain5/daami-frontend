import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import FrontendShell from '@/components/layout/FrontendShell';
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <SettingsProvider>
          <CartProvider>
            <FrontendShell>{children}</FrontendShell>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', borderRadius: '2px' },
                success: { iconTheme: { primary: '#C9A84C', secondary: '#fff' } },
              }}
            />
          </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
