import { setRequestLocale } from 'next-intl/server';
import { ClientPortalPageContent } from '@/components/sections/ClientPortalPageContent';
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
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe ? 'פורטל לקוחות | פרויקטים, בקשות וקבצים | CartShift Studio' : 'Client Portal | Projects, Files & Requests | CartShift Studio',
      description: isHe
        ? 'מרחב עבודה ללקוחות CartShift למעקב אחר פרויקטים ובקשות, שיתוף קבצים וסקירת תוצרים.'
        : 'A dedicated CartShift client workspace for project tracking, requests, files and deliverables.',
      url: '/tools/client-portal',
      keywords: [
        'client portal',
        'cartshift client portal',
        'project dashboard',
        'request tracking',
        'file sharing',
        'real-time updates',
        'client communication',
        'project transparency',
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'he' ? 'בית' : 'Home', url: '/' },
      { name: locale === 'he' ? 'כלים' : 'Tools', url: '/tools' },
      { name: locale === 'he' ? 'פורטל לקוחות' : 'Client Portal', url: '/tools/client-portal' },
    ],
    locale as 'en' | 'he'
  );

  const softwareSchema = generateSoftwareApplicationSchema({
    name: 'CartShift Client Portal',
    description:
      'A dedicated client portal for managing projects, tracking requests, sharing files, and staying connected with your development team.',
    url: '/tools/client-portal',
    operatingSystem: 'Any',
    applicationCategory: 'BusinessApplication',
    offers: {
      price: '0',
      priceCurrency: 'USD',
    },
    locale: locale as 'en' | 'he',
  });

  return (
    <>
      <Script
        id="portal-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="portal-software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <ClientPortalPageContent />
    </>
  );
}
