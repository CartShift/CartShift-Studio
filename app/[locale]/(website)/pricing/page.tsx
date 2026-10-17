import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PricingPageContent } from '@/components/sections/PricingPageContent';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateFAQPageSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe ? 'מחירים והיקפי עבודה לפיתוח Shopify | CartShift Studio' : 'Shopify Development Pricing & Project Scopes | CartShift Studio',
      description: isHe
        ? 'חבילות פיתוח Shopify, שדרוגים ואודיטים בתשלום. סקירה מקצועית ראשונית בחינם; היקף ותמחור מלא ייקבעו בהצעת עבודה.'
        : 'Shopify development packages, store improvements and paid deep-dive audits. Free initial expert review; final scope and pricing agreed in a proposal.',
      url: '/pricing',
      // Page visibility is currently controlled in the client; do not index gated content.
      noindex: true,
      keywords: [
        'Shopify development pricing',
        'WordPress development cost',
        'e-commerce development packages',
        'Shopify store cost',
        'web development pricing',
        'affordable Shopify developer',
      ],
    },
    locale as 'en' | 'he'
  );
}


export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const t = await getTranslations({ locale: locale as 'en' | 'he' });
  const pricingFaqs = t.raw('pricing.faq.items') as { question: string; answer: string }[];
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: t('navigation.home'), url: '/' },
      { name: t('pricing.hero.title'), url: '/pricing' },
    ],
    locale as 'en' | 'he'
  );

  const faqSchema = generateFAQPageSchema(pricingFaqs);

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingPageContent />
    </>
  );
}
