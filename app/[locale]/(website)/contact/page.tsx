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
      title: locale === 'de'
        ? 'Shopify- und E-Commerce-Beratung vereinbaren | CartShift Studio'
        : isHe
        ? 'שיחת ייעוץ ל-Shopify ול-ecommerce | CartShift Studio'
        : 'Book a Shopify or Ecommerce Consultation | CartShift Studio',
      description: locale === 'de'
        ? 'Sprechen Sie mit CartShift Studio über Shopify-SEO, Shop-Optimierung, Migrationen und Conversion-Probleme. Wir arbeiten mit englisch- und hebräischsprachigen Teams und beantworten Anfragen persönlich nach Verfügbarkeit.'
        : isHe
        ? 'דברו עם CartShift Studio על Shopify SEO, שדרוג חנות, מיגרציה או בעיות המרה. אנחנו עובדים בעברית ובאנגלית ומגיבים לפניות באופן אישי בהתאם לזמינות.'
        : 'Talk with CartShift Studio about Shopify SEO, store rebuilds, migrations, or conversion issues. We work with English and Hebrew-speaking teams and respond personally according to our availability.',
      url: '/contact',
      keywords: [
        ...(locale === 'de'
          ? ['Shopify-Beratung', 'technisches Shopify-SEO', 'E-Commerce-Entwicklung', 'Shopify-Agentur Kontakt']
          : isHe
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
    locale as 'en' | 'he' | 'de'
  );
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he' | 'de');
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'he' ? 'בית' : locale === 'de' ? 'Startseite' : 'Home', url: '/' },
      { name: locale === 'he' ? 'יצירת קשר' : locale === 'de' ? 'Kontakt' : 'Contact', url: '/contact' },
    ],
    locale as 'en' | 'he' | 'de'
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
