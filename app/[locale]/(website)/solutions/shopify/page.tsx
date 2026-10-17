import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShopifyTemplate } from '@/components/templates/ShopifyTemplate';
import {
  generateMetadata as genMeta,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateFAQPageSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe
        ? 'שירותי Shopify SEO ופיתוח | אודיט, מהירות, מיגרציה וצמיחה'
        : 'Shopify SEO and Development Services | Audits, Speed, Migration, Growth',
      description: isHe
        ? 'קבלו אודיט Shopify SEO, תיקונים טכניים, שיפור מהירות, תמיכה במיגרציה ופיתוח ממוקד המרות מצוות CartShift Studio. נבנה לצוותי ecommerce שרוצים צמיחה איכותית.'
        : 'Get Shopify SEO audits, technical fixes, speed optimization, migration support, and conversion-focused development from CartShift Studio. Built for ecommerce teams that want qualified growth.',
      url: '/solutions/shopify',
      keywords: [
        ...(isHe
          ? [
              'קידום אתרי שופיפיי',
              'אודיט שופיפיי',
              'SEO טכני לשופיפיי',
              'פיתוח שופיפיי',
              'שיפור מהירות שופיפיי',
            ]
          : [
              'shopify seo services',
              'shopify seo audit',
              'technical seo for shopify',
              'shopify development',
              'shopify migration seo',
              'shopify speed optimization',
              'shopify structured data',
              'shopify conversion optimization',
              'shopify agency',
              'shopify experts',
            ]),
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function ShopifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const serviceSchema = generateServiceSchema(
    'Shopify Development',
    'Expert Shopify development services including store setup, custom features, performance optimization, and ongoing support.',
    {
      locale: locale as 'en' | 'he',
      url: '/solutions/shopify',
    }
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'Home', url: '/' },
      { name: 'Solutions', url: '/' },
      { name: 'Shopify Development', url: '/solutions/shopify' },
    ],
    locale as 'en' | 'he'
  );

  // Use the same locale-specific FAQs for the visible page and structured data.
  const t = await getTranslations({ locale, namespace: 'shopify' });
  const faqItems = t.raw('faq.items') as Array<{ question: string; answer: string }>;
  const faqSchema = generateFAQPageSchema(faqItems);

  return (
    <>
      <Script
        id="shopify-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="shopify-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="shopify-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ShopifyTemplate />
    </>
  );
}
