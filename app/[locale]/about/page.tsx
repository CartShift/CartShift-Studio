import { AboutTemplate } from '@/components/templates/AboutTemplate';
import {
  generateMetadata as genMeta,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generatePersonSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = genMeta({
  title: 'About CartShift Studio | Expert E-commerce Development Team',
  description:
    'Meet the team behind CartShift Studio. Expert Shopify and WordPress developers dedicated to building custom e-commerce solutions for your business.',
  url: '/about',
  keywords: [
    'about us',
    'e-commerce team',
    'Shopify developers',
    'WordPress experts',
    'CartShift Studio team',
  ],
});

import { setRequestLocale } from 'next-intl/server';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const orgSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ]);

  const teamMembers = [
    {
      name: 'Technical Lead',
      jobTitle: 'Technical Lead & Co-er',
      description:
        'Expert in Shopify and WordPress development, specializing in custom e-commerce solutions and performance optimization.',
    },
    {
      name: 'Customer-Facing Partner',
      jobTitle: 'Customer-Facing Partner & Co-er',
      description:
        'Dedicated to building strong client relationships and ensuring exceptional customer experience throughout the development process.',
    },
  ];

  const personSchemas = teamMembers.map(member => generatePersonSchema(member));

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
      {personSchemas.map((schema, index) => (
        <Script
          key={index}
          id={`person-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <AboutTemplate />
    </>
  );
}
