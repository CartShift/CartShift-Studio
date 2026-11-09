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
      title: isHebrew
        ? "אודות CartShift Studio | יותם פרג'י ועדי זלטר"
        : 'About CartShift Studio | Yotam Faraggi & Adi Zelter',
      description: isHebrew
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
    locale as 'en' | 'he'
  );
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  const isHebrew = validLocale === 'he';
  setRequestLocale(validLocale);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const orgSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: isHebrew ? 'בית' : 'Home', url: '/' },
      { name: isHebrew ? 'אודות' : 'About', url: '/about' },
    ],
    validLocale
  );

  const yotamSchema = generatePersonSchema({
    name: 'Yotam Faraggi',
    jobTitle: 'Co-Founder & Senior Product Engineer',
    description:
      'Berlin-based Senior Product Engineer with 10+ years building and operating production software across full-stack products, commerce, APIs, integrations and cloud systems, with recent work in AI-assisted products.',
    url: `${siteUrl}/${locale}/yotam`,
    image: '/images/portfolio-v2/hero-art.webp',
    sameAs: [
      'https://linkedin.com/in/yotam-faraggi',
      'https://github.com/yotamon',
    ],
  });

  const adiSchema = generatePersonSchema({
    name: 'Adi Zelter',
    jobTitle: 'Co-Founder, Business Strategy & Web Development',
    description:
      'CartShift Studio co-founder connecting web development with business strategy, project leadership, client relations and audience experience.',
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
