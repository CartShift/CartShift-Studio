import { setRequestLocale } from 'next-intl/server';
import { PricingPageContent } from '@/components/sections/PricingPageContent';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateFAQPageSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = genMeta({
  title: 'Pricing & Packages | Shopify & WordPress Development',
  description:
    'Transparent pricing for Shopify and WordPress development. Packages starting at $500. No hidden fees. Get a custom quote.',
  url: '/pricing',
  keywords: [
    'Shopify development pricing',
    'WordPress development cost',
    'e-commerce development packages',
    'Shopify store cost',
    'web development pricing',
    'affordable Shopify developer',
  ],
});

const pricingFaqs = [
  {
    question: 'Do you offer payment plans?',
    answer:
      'Yes, for projects over $5,000, we typically split payments into milestones: 40% to start, 30% at design approval, and 30% at launch.',
  },
  {
    question: "What if my project doesn't fit these packages?",
    answer:
      "These are starting points. We'll scope your project properly and provide a custom quote based on your specific needs.",
  },
  {
    question: 'Are there any hidden fees?',
    answer:
      'No. We quote transparently. If something comes up during the project that changes scope, we discuss it before any additional work.',
  },
  {
    question: "What's not included in these prices?",
    answer:
      "Third-party costs like app subscriptions, themes (if purchasing one), domain registration, and ongoing hosting are separate. We'll outline everything clearly in your quote.",
  },
];

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' },
  ]);

  const faqSchema = generateFAQPageSchema(pricingFaqs);

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
      <PricingPageContent />
    </>
  );
}
