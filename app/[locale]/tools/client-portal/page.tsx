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
      title: 'Client Portal | Project Management Made Simple',
      description:
        'Manage your projects with ease. Track requests, review progress, share files, and communicate with our team — all in one place. No more email chains or lost messages.',
      url: '/tools/client-portal',
      keywords: [
        'client portal',
        'project management',
        'request tracking',
        'file sharing',
        'team collaboration',
        'project dashboard',
        'real-time updates',
        'client communication',
        'project transparency',
      ],
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
