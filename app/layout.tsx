import type { Metadata, Viewport } from 'next';
import { Outfit, Rubik } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const rubik = Rubik({ subsets: ['hebrew', 'latin'], variable: '--font-rubik', display: 'swap' });

export const metadata: Metadata = {
  title: 'CartShift Studio',
  description: 'Expert Shopify & WordPress development agency',
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        {process.env.GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.GOOGLE_SITE_VERIFICATION} />
        )}
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {/* TEMP BUILD TEST - DELETE AFTER CONFIRMING */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'blue',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          ROOT LAYOUT BUILD: JAN-21-V3
        </div>
        {children}
      </body>
    </html>
  );
}
