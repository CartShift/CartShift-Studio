import { setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe ? 'מדיניות פרטיות | CartShift Studio' : 'Privacy Policy | CartShift Studio',
      description: isHe ? 'כיצד CartShift Studio אוספת, משתמשת ושומרת מידע אישי.' : 'How CartShift Studio handles and protects personal information.',
      url: '/privacy',
      keywords: ['privacy policy', 'data protection', 'GDPR', 'cookie policy'],
    },
    locale as 'en' | 'he'
  );
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'he' ? 'בית' : 'Home', url: '/' },
      { name: locale === 'he' ? 'מדיניות פרטיות' : 'Privacy Policy', url: '/privacy' },
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
      <PrivacyContent />
    </>
  );
}
