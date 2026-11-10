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
      title: locale === 'de'
        ? 'WordPress-Entwicklung und Wartung | Content- und Unternehmenswebsites'
        : locale === 'he'
        ? 'פיתוח ותחזוקת WordPress | אתרי תוכן ועסקים'
        : 'WordPress Development & Maintenance | Content & Business Sites',
      description: locale === 'de'
        ? 'WordPress-Lösungen für umfangreiche Content- und Unternehmenswebsites: individuelle Themes, Performance, technisches SEO, Sicherheitswartung und redaktionelle Abläufe.'
        : locale === 'he'
        ? 'פיתוח WordPress לאתרי תוכן, מגזינים ועסקים: התאמות תבנית, ביצועים, SEO טכני, אבטחה ותחזוקה.'
        : 'WordPress for content-rich and business websites. Custom themes, performance, technical SEO, security maintenance and publishing workflows.',
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
    locale as 'en' | 'he' | 'de'
  );
}

export default async function WordPressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he' | 'de');
  const serviceSchema = generateServiceSchema(
    locale === 'de' ? 'WordPress-Entwicklung' : 'WordPress Development',
    locale === 'de'
      ? 'Professionelle WordPress-Entwicklung für Content-Websites, Nachrichtenportale und individuelle Websites, einschließlich Theme-Anpassung, Performance-Optimierung und laufender Betreuung.'
      : 'Expert WordPress development services for content sites, news platforms, and custom websites. Theme customization, performance optimization, and ongoing support.',
    {
      locale: locale as 'en' | 'he' | 'de',
      url: '/solutions/wordpress',
    }
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'de' ? 'Startseite' : 'Home', url: '/' },
      { name: locale === 'de' ? 'Lösungen' : 'Solutions', url: '/' },
      { name: locale === 'de' ? 'WordPress-Entwicklung' : 'WordPress Development', url: '/solutions/wordpress' },
    ],
    locale as 'en' | 'he' | 'de'
  );

  // Use the same locale-specific FAQs for the visible page and structured data.
  const t = await getTranslations({ locale: locale as 'en' | 'he' | 'de', namespace: 'wordpress' });
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
