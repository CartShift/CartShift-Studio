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
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { BrandingProvider } from '@/components/providers/BrandingProvider';
import { Logger } from '@/lib/logger';

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

  const messages = await getMessages();
  const orgSchema = generateOrganizationSchema();

  let schemaJson: string;
  try {
    schemaJson = JSON.stringify(orgSchema);
  } catch (error) {
    Logger.error('Failed to stringify organization schema', error);
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
              <NextIntlClientProvider messages={messages} locale={locale as 'en' | 'he'}>
                <LocaleAttributes />
                <GeoLocaleRedirect />
                <GoogleAnalytics />
                <AnalyticsProvider>
                  <ConditionalLayout>{children}</ConditionalLayout>
                </AnalyticsProvider>
              </NextIntlClientProvider>
            </MotionConfig>
          </MotionProvider>
        </BrandingProvider>
      </ThemeProvider>
    </>
  );
}
