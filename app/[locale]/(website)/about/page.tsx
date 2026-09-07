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
  return genMeta(
    {
      title: 'About CartShift Studio | Yotam Faraggi & Team',
      description:
        'Meet Yotam Faraggi, a Berlin-based Senior Product Engineer and co-founder of CartShift Studio, and the team building high-quality Shopify, WordPress, and custom web products.',
      url: '/about',
      keywords: [
        'Yotam Faraggi',
        'Senior Product Engineer Berlin',
        'about us',
        'e-commerce team',
        'Shopify developers',
        'WordPress experts',
        'CartShift Studio team',
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const orgSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' },
    ],
    locale as 'en' | 'he'
  );

  const yotamSchema = generatePersonSchema({
    name: 'Yotam Faraggi',
    jobTitle: 'Co-Founder & Senior Product Engineer',
    description:
      'Berlin-based Senior Product Engineer with 10+ years of experience building full-stack products, e-commerce systems, integrations, and AI-assisted software.',
    url: `${siteUrl}/${locale}/cv`,
    image: '/images/portfolio-v2/hero-art.webp',
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
      <AboutTemplate />
    </>
  );
}
