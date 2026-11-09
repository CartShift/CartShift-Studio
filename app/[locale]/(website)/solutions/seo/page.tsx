import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SeoTemplate } from '@/components/templates/SeoTemplate';
import {
  generateBreadcrumbSchema,
  generateFAQPageSchema,
  generateMetadata as generateSeoMetadata,
  generateServiceSchema,
} from '@/lib/seo';

type Locale = 'en' | 'he';

interface SeoFaqItem {
  question: string;
  answer: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const t = await getTranslations({ locale });

  return generateSeoMetadata(
    {
      title: t('seo.metadata.title'),
      description: t('seo.metadata.description'),
      url: '/solutions/seo',
      keywords: t.raw('seo.metadata.keywords') as string[],
    },
    locale
  );
}

export default async function SeoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const faqItems = t.raw('seo.faq.items') as SeoFaqItem[];
  const serviceSchema = generateServiceSchema(
    t('seo.schema.serviceName'),
    t('seo.schema.serviceDescription'),
    {
      locale,
      url: '/solutions/seo',
    }
  );
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: t('seo.breadcrumb.home'), url: '/' },
      { name: t('seo.breadcrumb.solutions'), url: '/' },
      { name: t('seo.breadcrumb.current'), url: '/solutions/seo' },
    ],
    locale
  );
  const faqSchema = generateFAQPageSchema(faqItems);

  return (
    <>
      <Script
        id="seo-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="seo-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="seo-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SeoTemplate />
    </>
  );
}
