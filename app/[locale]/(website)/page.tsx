import { Hero } from '@/components/sections/Hero';
import { ServicesOverview } from '@/components/sections/ServicesOverview';
import { WhyChoose } from '@/components/sections/WhyChoose';
import { CaseStudiesTeaser } from '@/components/sections/CaseStudiesTeaser';
import { Testimonials } from '@/components/sections/Testimonials';
import { Process } from '@/components/sections/Process';
import { BlogTeaser } from '@/components/sections/BlogTeaser';
import { CTABanner } from '@/components/sections/CTABanner';
import { getAllPosts } from '@/lib/markdown';
import { toBlogPostSummary } from '@/lib/blog-summary';
import { getAllCaseStudies } from '@/lib/case-studies';
import {
  generateMetadata as genMeta,
  generateWebSiteSchema,
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
      title: locale === 'de'
        ? 'Partner für Shopify-Entwicklung und technisches SEO | CartShift Studio'
        : isHe
        ? 'שותף ל-Shopify ול-SEO טכני | CartShift Studio'
        : 'Shopify Development and SEO Partner | CartShift Studio',
      description: locale === 'de'
        ? 'CartShift Studio unterstützt E-Commerce-Teams mit Shopify-Entwicklung, technischem SEO, Migrationen, Performance-Optimierung und conversionorientierter Umsetzung auf Englisch und Hebräisch.'
        : isHe
        ? 'CartShift Studio עוזרת לצוותי ecommerce לצמוח דרך פיתוח Shopify, SEO טכני, מיגרציות, שיפור מהירות ואופטימיזציה ממוקדת המרות בעברית ובאנגלית.'
        : 'CartShift Studio helps ecommerce teams grow through Shopify development, technical SEO, migration support, speed optimization, and conversion-focused implementation in English and Hebrew.',
      url: '/',
      keywords: [
        ...(locale === 'de'
          ? ['Shopify-Entwicklung', 'technisches Shopify-SEO', 'Shopify-Migration', 'E-Commerce-Optimierung']
          : isHe
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
    locale as 'en' | 'he' | 'de'
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he' | 'de');
  const websiteSchema = generateWebSiteSchema(locale as 'en' | 'he' | 'de');
  const professionalServiceSchema = generateProfessionalServiceSchema();
  const posts = await getAllPosts();
  const latestPosts = posts.slice(0, 4).map(toBlogPostSummary);
  // Curate documented work with reviewable deliverables; do not imply measured uplift.
  const selectedCaseSlugs = new Set([
    'i-love-my-honeypot-eco-ecommerce',
    'stiletto-piercing-disposable-jewelry-supply',
    'alondon-community-portal',
  ]);
  const selectedCaseStudies = getAllCaseStudies(locale).filter(study =>
    selectedCaseSlugs.has(study.slug)
  );

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="professional-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <Hero />
      <ServicesOverview />
      <CaseStudiesTeaser caseStudies={selectedCaseStudies} locale={locale as 'en' | 'he' | 'de'} />
      <Process />
      <WhyChoose />
      <Testimonials />
      <BlogTeaser posts={latestPosts} />
      <CTABanner />
    </>
  );
}
