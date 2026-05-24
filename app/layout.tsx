import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CartShift Studio',
  description: 'Expert Shopify & WordPress development agency',
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-ipad-76x76.png', sizes: '76x76' },
      { url: '/apple-touch-icon-ipad-retina-152x152.png', sizes: '152x152' },
      { url: '/apple-touch-icon-iphone-60x60.png', sizes: '60x60' },
      { url: '/apple-touch-icon-iphone-retina-120x120.png', sizes: '120x120' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
