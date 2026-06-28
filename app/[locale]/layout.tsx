import type { Metadata } from 'next';
import { Outfit, Rubik } from 'next/font/google';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { RadixProvider } from '@/components/providers/RadixProvider';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const rubik = Rubik({ subsets: ['hebrew', 'latin'], variable: '--font-rubik', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalUrl = `${siteUrl}/${locale}`;
  return {
    title: {
      default: 'CartShift Studio | Shopify & WordPress E-commerce Development Agency',
      template: '%s | CartShift Studio',
    },
    description:
      'Expert Shopify & WordPress development agency. Custom e-commerce stores, migrations, and optimization. Get a free consultation for your online store project.',
    keywords: [
      'Shopify development',
      'WordPress development',
      'e-commerce agency',
      'Shopify store setup',
      'WooCommerce development',
      'e-commerce migration',
      'custom Shopify theme',
      'Shopify SEO',
      'online store development',
    ],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${siteUrl}/en`,
        he: `${siteUrl}/he`,
        'x-default': `${siteUrl}/en`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'CartShift Studio',
      title: 'CartShift Studio | Shopify & WordPress E-commerce Development Agency',
      description:
        'Expert Shopify & WordPress development agency. Custom e-commerce stores, migrations, and optimization.',
      url: canonicalUrl,
      images: [
        {
          url: `${siteUrl}/images/CarShift-Icon-Colored.png`,
          width: 512,
          height: 512,
          alt: 'CartShift Studio - E-commerce Development Agency',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CartShift Studio | E-commerce Development Agency',
      description:
        'Expert Shopify & WordPress development agency. Custom e-commerce stores, migrations, and optimization.',
      images: [`${siteUrl}/images/CarShift-Icon-Colored.png`],
      creator: '@cartshiftstudio',
      site: '@cartshiftstudio',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    other: {
      'og:locale:alternate': locale === 'he' ? 'en_US' : 'he_IL',
    },
    category: 'technology',
  };
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Enable static rendering by providing the locale to next-intl
  setRequestLocale(locale as 'en' | 'he');

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const isRtl = locale === 'he';

  return (
    <html
      lang={locale}
      dir={direction}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${outfit.variable} ${rubik.variable} ${isRtl ? 'rtl-ready' : ''}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        {process.env.GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.GOOGLE_SITE_VERIFICATION} />
        )}
      </head>
      <body className={`font-sans ${isRtl ? 'lang-he' : ''}`} suppressHydrationWarning>
        <RadixProvider dir={direction}>{children}</RadixProvider>
      </body>
    </html>
  );
}
