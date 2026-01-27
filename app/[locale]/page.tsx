import { Hero } from '@/components/sections/Hero';
import { HomepageIntro } from '@/components/sections/HomepageIntro';
import { ServicesOverview } from '@/components/sections/ServicesOverview';
import { WhyChoose } from '@/components/sections/WhyChoose';
import { Process } from '@/components/sections/Process';
import { StatsCounter } from '@/components/sections/StatsCounter';
import { Testimonials } from '@/components/sections/Testimonials';
import { BlogTeaser } from '@/components/sections/BlogTeaser';
import { PortalTeaser } from '@/components/sections/PortalTeaser';
import { StoreAnalyzerTeaser } from '@/components/sections/StoreAnalyzerTeaser';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return genMeta(
    {
      title: 'E-commerce Development Agency | Shopify & WordPress Experts | CartShift Studio',
      description:
        '🚀 Transform your e-commerce vision into reality. Expert Shopify & WordPress development with 50+ successful launches. Custom stores, migrations, and optimization. Get your free consultation today!',
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
        'e-commerce consultants',
        'Shopify developers',
      ],
    },
    locale as 'en' | 'he'
  );
}

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
      author: 'Carmel Faraggi',
      text: "The new design perfectly captures the essence of our community. It's not just a website; it's a home for Israelis in London.",
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
      <StoreAnalyzerTeaser />
      <PortalTeaser />
      <BlogTeaser />
      <CTABanner />
    </>
  );
}
