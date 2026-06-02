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
import { getAllPosts } from '@/lib/markdown';
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
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe
        ? 'שותף ל-Shopify ול-SEO טכני | CartShift Studio'
        : 'Shopify Development and SEO Partner | CartShift Studio',
      description: isHe
        ? 'CartShift Studio עוזרת לצוותי ecommerce לצמוח דרך פיתוח Shopify, SEO טכני, מיגרציות, שיפור מהירות ואופטימיזציה ממוקדת המרות בעברית ובאנגלית.'
        : 'CartShift Studio helps ecommerce teams grow through Shopify development, technical SEO, migration support, speed optimization, and conversion-focused implementation in English and Hebrew.',
      url: '/',
      keywords: [
        ...(isHe
          ? [
              'קידום אתרי שופיפיי',
              'פיתוח שופיפיי',
              'SEO טכני לשופיפיי',
              'ייעוץ איקומרס',
              'סוכנות שופיפיי',
            ]
          : [
              'shopify development agency',
              'shopify seo partner',
              'technical seo for shopify',
              'shopify migration support',
              'ecommerce development',
              'conversion optimization agency',
              'hebrew shopify agency',
              'shopify consultants',
            ]),
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const websiteSchema = generateWebSiteSchema(locale as 'en' | 'he');
  const professionalServiceSchema = generateProfessionalServiceSchema();
  const posts = await getAllPosts();
  const latestPosts = posts.slice(0, 4);

  const reviewSchema = generateReviewSchema([
    {
      author: 'Danielle Shamir',
      text: 'CartShift Studio understood our mission from day one. They built us a store that educates customers while making the shopping experience effortless.',
      rating: 5,
    },
    {
      author: 'Carmel Faraggi',
      text: 'CartShift Studio transformed Alondon into a sophisticated, high-performance community hub. The new architecture seamlessly handles our complex content.',
      rating: 5,
    },
    {
      author: 'Tom Robinson',
      text: 'Working with CartShift Studio was a game-changer for our studio. They created a sleek, high-end digital catalog that perfectly showcases our jewelry collection.',
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
      <BlogTeaser posts={latestPosts} />
      <CTABanner />
    </>
  );
}
