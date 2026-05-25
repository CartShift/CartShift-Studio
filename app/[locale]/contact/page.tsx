import { setRequestLocale } from 'next-intl/server';
import { ContactTemplate } from '@/components/templates/ContactTemplate';
import type { Metadata } from 'next';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateLocalBusinessSchema,
} from '@/lib/seo';
import Script from 'next/script';

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
        ? 'שיחת ייעוץ ל-Shopify ול-ecommerce | CartShift Studio'
        : 'Book a Shopify or Ecommerce Consultation | CartShift Studio',
      description: isHe
        ? 'דברו עם CartShift Studio על Shopify SEO, שדרוג חנות, מיגרציה או בעיות המרה. אנחנו עובדים בעברית ובאנגלית וחוזרים תוך 24 שעות.'
        : 'Talk with CartShift Studio about Shopify SEO, store rebuilds, migrations, or conversion issues. We work with English and Hebrew-speaking teams and reply within 24 hours.',
      url: '/contact',
      keywords: [
        ...(isHe
          ? ['ייעוץ שופיפיי', 'ייעוץ Shopify SEO', 'ייעוץ איקומרס', 'יצירת קשר שופיפיי']
          : [
              'shopify consultation',
              'shopify seo consultation',
              'ecommerce development consultation',
              'shopify agency contact',
              'hebrew ecommerce consultant',
            ]),
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' },
    ],
    locale as 'en' | 'he'
  );
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <>
      <Script
        id="contact-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <ContactTemplate />
    </>
  );
}
