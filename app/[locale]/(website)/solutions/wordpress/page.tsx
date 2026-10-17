import { getTranslations, setRequestLocale } from 'next-intl/server';
import { WordPressTemplate } from '@/components/templates/WordPressTemplate';
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
  return genMeta(
    {
      title: locale === 'he'
        ? 'פיתוח WordPress ו־WooCommerce | אתרי תוכן ואתרים עסקיים'
        : 'WordPress & WooCommerce Development | Content & Business Sites',
      description: locale === 'he'
        ? 'פיתוח WordPress לאתרי תוכן ולעסקים, כולל WooCommerce במקרים המתאימים. התאמות תבנית, ביצועים, SEO טכני ותחזוקה בהתאם לצורכי האתר.'
        : 'WordPress for content and business websites, plus WooCommerce where it fits. Custom themes, performance, technical SEO, and maintainable publishing workflows.',
      url: '/solutions/wordpress',
      keywords: [
        'WordPress development',
        'custom WordPress theme',
        'WordPress content site',
        'WordPress news platform',
        'WordPress performance optimization',
        'WordPress SEO',
        'WordPress developer',
        'WordPress migration',
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function WordPressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const serviceSchema = generateServiceSchema(
    'WordPress Development',
    'Expert WordPress development services for content sites, news platforms, and custom websites. Theme customization, performance optimization, and ongoing support.',
    {
      locale: locale as 'en' | 'he',
      url: '/solutions/wordpress',
    }
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'Home', url: '/' },
      { name: 'Solutions', url: '/' },
      { name: 'WordPress Development', url: '/solutions/wordpress' },
    ],
    locale as 'en' | 'he'
  );

  // Use the same locale-specific FAQs for the visible page and structured data.
  const t = await getTranslations({ locale: locale as 'en' | 'he', namespace: 'wordpress' });
  const faqItems = t.raw('faq.items') as Array<{ question: string; answer: string }>;
  const faqSchema = generateFAQPageSchema(faqItems);

  return (
    <>
      <Script
        id="wordpress-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="wordpress-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="wordpress-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <WordPressTemplate />
    </>
  );
}
