import type { Metadata } from 'next';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LocaleAttributes } from '@/components/providers/LocaleAttributes';
import { GeoLocaleRedirect } from '@/components/providers/GeoLocaleRedirect';

import { generateOrganizationSchema } from '@/lib/seo';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { MotionProvider } from '@/lib/motion';
import { MotionConfig } from '@/lib/motion';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BrandingProvider } from '@/components/providers/BrandingProvider';
import { ToastProvider } from '@/components/ui/Toast';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

function loadMessages(locale: 'en' | 'he') {
  try {
    const filePath = join(process.cwd(), 'messages', `${locale}.json`);
    const fileContents = readFileSync(filePath, 'utf8');
    const trimmed = fileContents.trim();
    return JSON.parse(trimmed);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load messages for locale ${locale}:`, errorMessage);

    if (locale === 'en') {
      throw new Error(`Failed to load English messages: ${errorMessage}`);
    }

    try {
      const fallbackPath = join(process.cwd(), 'messages', 'en.json');
      const fallbackContents = readFileSync(fallbackPath, 'utf8');
      const trimmed = fallbackContents.trim();
      return JSON.parse(trimmed);
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `Failed to load both ${locale} and fallback (en) messages. ${locale} error: ${errorMessage}. Fallback error: ${fallbackMessage}`
      );
    }
  }
}

export const metadata: Metadata = {
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
    canonical: siteUrl,
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
    url: siteUrl,
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
  category: 'technology',
};

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

  const messages = loadMessages(locale as 'en' | 'he');
  const orgSchema = generateOrganizationSchema();

  let schemaJson: string;
  try {
    schemaJson = JSON.stringify(orgSchema);
  } catch (error) {
    console.error('Failed to stringify organization schema:', error);
    schemaJson = '{}';
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      <ThemeProvider>
        <BrandingProvider>
          <MotionProvider>
            <MotionConfig
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
            >
              <NextIntlClientProvider messages={messages} locale={locale}>
                <LocaleAttributes />
                <GeoLocaleRedirect />
                <GoogleAnalytics />
                <AnalyticsProvider>
                  <ToastProvider>
                    <ConditionalLayout>{children}</ConditionalLayout>
                  </ToastProvider>
                </AnalyticsProvider>
              </NextIntlClientProvider>
            </MotionConfig>
          </MotionProvider>
        </BrandingProvider>
      </ThemeProvider>
    </>
  );
}
