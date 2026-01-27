import { setRequestLocale } from 'next-intl/server';
import { StoreAnalyzerTemplate } from '@/components/templates/StoreAnalyzerTemplate';
import type { Metadata } from 'next';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateSoftwareApplicationSchema,
} from '@/lib/seo';
import Script from 'next/script';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return genMeta(
    {
      title: 'Free E-Commerce Store Analyzer | Instant Audit Tool',
      description:
        'Get a free, comprehensive audit of your Shopify, WooCommerce, or Magento store. Analyze performance, SEO, UX, and get actionable recommendations in minutes.',
      url: '/tools/store-analyzer',
      keywords: [
        'shopify audit',
        'ecommerce audit tool',
        'store analyzer',
        'free store audit',
        'woocommerce analyzer',
        'magento audit',
        'ecommerce performance checker',
        'online store health check',
        'conversion rate optimization',
        'ecommerce seo audit',
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function StoreAnalyzerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Store Analyzer', url: '/tools/store-analyzer' },
  ]);

  const softwareSchema = generateSoftwareApplicationSchema({
    name: 'E-Commerce Store Analyzer',
    description:
      'Free tool that analyzes your online store for performance, SEO, UX, and conversion optimization opportunities.',
    operatingSystem: 'Any',
    applicationCategory: 'BusinessApplication',
    offers: {
      price: '0',
      priceCurrency: 'USD',
    },
  });

  return (
    <>
      <Script
        id="analyzer-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="analyzer-software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <StoreAnalyzerTemplate />
    </>
  );
}
