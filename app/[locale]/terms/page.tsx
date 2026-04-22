import { setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';
import TermsContent from './TermsContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return genMeta(
    {
      title: 'Terms of Service',
      description:
        'CartShift Studio terms of service. Read our terms and conditions for using our website and services.',
      url: '/terms',
      keywords: ['terms of service', 'terms and conditions', 'legal', 'user agreement'],
      noindex: true,
    },
    locale as 'en' | 'he'
  );
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/terms' },
  ]);

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TermsContent />
    </>
  );
}
