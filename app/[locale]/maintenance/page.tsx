import { setRequestLocale } from 'next-intl/server';
import { MaintenancePageContent } from '@/components/sections/MaintenancePageContent';
import {
  generateMetadata as genMeta,
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
      title: 'Maintenance & Support Plans | Keep Your Store Running',
      description:
        'Monthly support plans for Shopify stores. Updates, backups, monitoring, and dedicated support. Plans starting at $299/month.',
      url: '/maintenance',
      keywords: [
        'maintenance plans',
        'Shopify support',
        'e-commerce maintenance',
        'website support',
        'monthly support',
      ],
    },
    locale as 'en' | 'he'
  );
}

const maintenanceFaqs = [
  {
    question: 'What if I need more hours than my plan includes?',
    answer:
      "Additional hours are billed at $150/hour. We'll always let you know before any extra work is done.",
  },
  {
    question: 'Can I change plans?',
    answer:
      'Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: "What's considered an emergency?",
    answer:
      'Site down, checkout broken, or security incidents. Premium plan members get same-day response for emergencies.',
  },
  {
    question: "Do you support stores you didn't build?",
    answer:
      "Yes, we take on maintenance for existing stores. We'll do an initial review to understand your setup first.",
  },
];

export default async function MaintenancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Maintenance & Support', url: '/maintenance' },
  ]);

  const faqSchema = generateFAQPageSchema(maintenanceFaqs);

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <MaintenancePageContent />
    </>
  );
}
