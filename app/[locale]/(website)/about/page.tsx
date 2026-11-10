import { setRequestLocale } from 'next-intl/server';
import { AboutTemplate } from '@/components/templates/AboutTemplate';
import {
  generateMetadata as genMeta,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generatePersonSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHebrew = locale === 'he';

  return genMeta(
    {
      title: locale === 'de'
        ? 'Über CartShift Studio | Yotam Faraggi und Adi Zelter'
        : isHebrew
        ? "אודות CartShift Studio | יותם פרג'י ועדי זלטר"
        : 'About CartShift Studio | Yotam Faraggi & Adi Zelter',
      description: locale === 'de'
        ? 'Lernen Sie CartShift Studio kennen: Yotam Faraggi, Senior Product Engineer in Berlin mit über zehn Jahren Erfahrung, und Adi Zelter, die Entwicklung, Geschäftsstrategie und Kundenerlebnis verbindet.'
        : isHebrew
        ? 'הכירו את CartShift Studio: יותם פרג׳י, Senior Product Engineer בברלין עם 10+ שנות ניסיון, ועדי זלטר, שמחברת פיתוח עם אסטרטגיה עסקית וחוויית לקוח.'
        : 'Meet CartShift Studio: Yotam Faraggi, a Berlin-based Senior Product Engineer with 10+ years in production software, and Adi Zelter, connecting development with business strategy and client experience.',
      url: '/about',
      keywords: [
        'Yotam Faraggi',
        'Senior Product Engineer Berlin',
        'Adi Zelter',
        'CartShift Studio',
        'product engineering',
        'e-commerce development',
        'Shopify developers',
        'WordPress development',
      ],
    },
    locale as 'en' | 'he' | 'de'
  );
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he' | 'de';
  const isHebrew = validLocale === 'he';
  setRequestLocale(validLocale);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const orgSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: isHebrew ? 'בית' : locale === 'de' ? 'Startseite' : 'Home', url: '/' },
      { name: isHebrew ? 'אודות' : locale === 'de' ? 'Über uns' : 'About', url: '/about' },
    ],
    validLocale
  );

  const yotamSchema = generatePersonSchema({
    name: 'Yotam Faraggi',
    jobTitle: locale === 'de' ? 'Mitgründer und Senior Product Engineer' : 'Co-Founder & Senior Product Engineer',
    description:
      locale === 'de' ? 'Senior Product Engineer in Berlin mit über zehn Jahren Erfahrung in Entwicklung und Betrieb produktiver Full-Stack-Produkte, E-Commerce-Systeme, APIs, Integrationen und Cloud-Systeme, zuletzt auch mit KI-gestützten Produkten.' : 'Berlin-based Senior Product Engineer with 10+ years building and operating production software across full-stack products, commerce, APIs, integrations and cloud systems, with recent work in AI-assisted products.',
    url: `${siteUrl}/${locale === 'de' ? 'en' : locale}/yotam`,
    image: '/images/portfolio-v2/hero-art.webp',
    sameAs: [
      'https://linkedin.com/in/yotam-faraggi',
      'https://github.com/yotamon',
    ],
  });

  const adiSchema = generatePersonSchema({
    name: 'Adi Zelter',
    jobTitle: locale === 'de' ? 'Mitgründerin, Geschäftsstrategie und Webentwicklung' : 'Co-Founder, Business Strategy & Web Development',
    description:
      locale === 'de' ? 'Mitgründerin von CartShift Studio, die Webentwicklung mit Geschäftsstrategie, Projektleitung, Kundenbetreuung und Nutzererfahrung verbindet.' : 'CartShift Studio co-founder connecting web development with business strategy, project leadership, client relations and audience experience.',
    url: `${siteUrl}/${locale}/about`,
    image: '/images/yotam-and-adi.png',
  });

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <Script
        id="about-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="yotam-person-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yotamSchema) }}
      />
      <Script
        id="adi-person-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(adiSchema) }}
      />
      <AboutTemplate />
    </>
  );
}
