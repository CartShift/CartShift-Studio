import type { Metadata, Viewport } from 'next';
import { Outfit, Rubik } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const rubik = Rubik({ subsets: ['hebrew', 'latin'], variable: '--font-rubik', display: 'swap' });

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${outfit.variable} ${rubik.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {process.env.GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.GOOGLE_SITE_VERIFICATION} />
        )}
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
