import { Hero } from '@/components/sections/Hero';
import { HomepageIntro } from '@/components/sections/HomepageIntro';
import { ServicesOverview } from '@/components/sections/ServicesOverview';
import { WhyChoose } from '@/components/sections/WhyChoose';
import { Process } from '@/components/sections/Process';
import { StatsCounter } from '@/components/sections/StatsCounter';
import { Testimonials } from '@/components/sections/Testimonials';
import { BlogTeaser } from '@/components/sections/BlogTeaser';
import { PortalTeaser } from '@/components/sections/PortalTeaser';
import { CTABanner } from '@/components/sections/CTABanner';
import {
  generateMetadata as genMeta,
  generateWebSiteSchema,
  generateReviewSchema,
  generateProfessionalServiceSchema,
} from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = genMeta({
  title: 'CartShift Studio | Shopify & WordPress E-commerce Development Agency',
  description:
    'Expert Shopify & WordPress development agency. Custom e-commerce stores, migrations, and optimization. Get a free consultation for your online store project.',
  url: '/',
  keywords: [
    'Shopify development agency',
    'WordPress e-commerce',
    'custom Shopify store',
    'e-commerce development',
    'Shopify migration',
    'WooCommerce development',
    'online store design',
    'Shopify experts',
  ],
});

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const websiteSchema = generateWebSiteSchema();
  const professionalServiceSchema = generateProfessionalServiceSchema();

  const reviewSchema = generateReviewSchema([
    {
      author: 'Sarah Johnson',
      text: 'CartShift Studio rebuilt our store experience end-to-end. Conversions improved quickly, and the site finally feels premium.',
      rating: 5,
    },
    {
      author: 'Michael Chen',
      text: 'They handled our migration flawlessly and made the store noticeably faster. Customers felt the difference immediately.',
      rating: 5,
    },
    {
      author: 'Emily Rodriguez',
      text: "They don't just ship a site. They stick around, iterate, and help us grow month after month.",
      rating: 5,
    },
  ]);

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="review-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
      <Script
        id="professional-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <Hero />
      <HomepageIntro />
      <ServicesOverview />
      <Process />
      <WhyChoose />
      <StatsCounter />
      <Testimonials />
      <PortalTeaser />
      <BlogTeaser />
      <CTABanner />
    </>
  );
}
