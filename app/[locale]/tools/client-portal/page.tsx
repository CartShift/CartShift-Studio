import { setRequestLocale } from 'next-intl/server';
import { ClientPortalPageContent } from '@/components/sections/ClientPortalPageContent';
import type { Metadata } from 'next';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateSoftwareApplicationSchema,
} from '@/lib/seo';
import Script from 'next/script';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return genMeta(
    {
      title: 'Client Portal for CartShift Clients | Track Projects, Files, and Requests',
      description:
        'A dedicated client workspace for CartShift projects. Approved clients can track requests, review deliverables, share files, and keep communication in one organized place.',
      url: '/tools/client-portal',
      keywords: [
        'client portal',
        'cartshift client portal',
        'project dashboard',
        'request tracking',
        'file sharing',
        'real-time updates',
        'client communication',
        'project transparency',
      ],
      noindex: true,
    },
    locale as 'en' | 'he'
  );
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Client Portal', url: '/tools/client-portal' },
  ]);

  const softwareSchema = generateSoftwareApplicationSchema({
    name: 'CartShift Client Portal',
    description:
      'A dedicated client portal for managing projects, tracking requests, sharing files, and staying connected with your development team.',
    url: '/tools/client-portal',
    operatingSystem: 'Any',
    applicationCategory: 'BusinessApplication',
    offers: {
      price: '0',
      priceCurrency: 'USD',
    },
  });

  return (
    <>
      <Script
        id="portal-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="portal-software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <ClientPortalPageContent />
    </>
  );
}
