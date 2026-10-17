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
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe ? 'תנאי שימוש | CartShift Studio' : 'Terms of Service | CartShift Studio',
      description: isHe ? 'תנאי השימוש באתר ובשירותי CartShift Studio.' : 'Terms for using the CartShift Studio website and services.',
      url: '/terms',
      keywords: ['terms of service', 'terms and conditions', 'legal', 'user agreement'],
    },
    locale as 'en' | 'he'
  );
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'he' ? 'בית' : 'Home', url: '/' },
      { name: locale === 'he' ? 'תנאי שימוש' : 'Terms of Service', url: '/terms' },
    ],
    locale as 'en' | 'he'
  );

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
