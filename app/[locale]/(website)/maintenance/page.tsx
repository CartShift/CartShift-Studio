import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MaintenancePageContent } from '@/components/sections/MaintenancePageContent';
import {
  generateMetadata as genMeta,
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
      title: isHe ? 'תמיכה ותחזוקה לחנויות Shopify | CartShift Studio' : 'Shopify Support & Maintenance Plans | CartShift Studio',
      description: isHe
        ? 'תוכניות תחזוקה ותמיכה לחנויות Shopify: בדיקות תקופתיות, פיתוח ושיפור שוטף לפי היקף מוסכם.'
        : 'Shopify maintenance and support plans covering agreed store checks, ongoing improvements and development support.',
      url: '/maintenance',
      // Client-side configuration can hide this offer; avoid indexing an empty gated view.
      noindex: true,
      keywords: [
        'maintenance plans',
        'Shopify support',
        'e-commerce maintenance',
        'website support',
        'monthly support',
      ],
    },
    locale as 'en' | 'he'
  );
}


export default async function MaintenancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const t = await getTranslations({ locale: locale as 'en' | 'he' });
  const maintenanceFaqs = t.raw('maintenance.faq.items') as { question: string; answer: string }[];
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: t('navigation.home'), url: '/' },
      { name: t('maintenance.hero.title'), url: '/maintenance' },
    ],
    locale as 'en' | 'he'
  );

  const faqSchema = generateFAQPageSchema(maintenanceFaqs);

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
      <MaintenancePageContent />
    </>
  );
}
