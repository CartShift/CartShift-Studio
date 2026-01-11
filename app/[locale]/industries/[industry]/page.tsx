import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Script from 'next/script';
import { IndustryPageContent } from '@/components/sections/IndustryPageContent';
import { generateMetadata as genMeta, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo';

interface IndustryPageProps {
  params: Promise<{ locale: string; industry: string }>;
}

const INDUSTRIES = ['fashion', 'food', 'health', 'tech', 'arts', 'local'] as const;
type IndustrySlug = (typeof INDUSTRIES)[number];

interface IndustryMeta {
  title: string;
  description: string;
  keywords: string[];
}

const INDUSTRY_META: Record<IndustrySlug, { en: IndustryMeta; he: IndustryMeta }> = {
  fashion: {
    en: {
      title: 'Fashion & Apparel E-commerce',
      description: 'Build a stunning fashion e-commerce store that converts. Shopify & WordPress solutions for fashion brands, clothing stores, and apparel businesses.',
      keywords: ['fashion e-commerce', 'clothing store website', 'apparel Shopify', 'fashion online store', 'fashion brand website'],
    },
    he: {
      title: 'חנויות אופנה',
      description: 'בנו חנות אופנה אונליין מרהיבה שממירה. פתרונות שופיפיי ווורדפרס למותגי אופנה.',
      keywords: ['חנות אופנה אונליין', 'אתר ביגוד', 'מותג אופנה'],
    },
  },
  food: {
    en: {
      title: 'Food & Beverage Websites',
      description: 'Online ordering, digital menus, and reservation systems for restaurants, cafes, and food businesses. Custom solutions that drive orders.',
      keywords: ['restaurant website', 'food ordering system', 'digital menu', 'restaurant Shopify', 'cafe website'],
    },
    he: {
      title: 'אתרים למזון ומשקאות',
      description: 'הזמנות אונליין, תפריטים דיגיטליים ומערכות הזמנות למסעדות ועסקי מזון.',
      keywords: ['אתר מסעדה', 'הזמנות אונליין', 'תפריט דיגיטלי'],
    },
  },
  health: {
    en: {
      title: 'Health & Wellness E-commerce',
      description: 'E-commerce solutions for supplements, fitness equipment, and wellness brands. Build trust and drive conversions.',
      keywords: ['health e-commerce', 'supplements store', 'wellness website', 'fitness e-commerce', 'health brand website'],
    },
    he: {
      title: 'חנויות בריאות ואיכות חיים',
      description: 'פתרונות מסחר אלקטרוני לתוספי תזונה, כושר ומותגי בריאות.',
      keywords: ['חנות תוספי תזונה', 'אתר בריאות', 'חנות כושר'],
    },
  },
  tech: {
    en: {
      title: 'Tech & SaaS Websites',
      description: 'High-converting landing pages and websites for tech startups and SaaS products. Modern design that showcases innovation.',
      keywords: ['SaaS website', 'tech startup website', 'landing page design', 'software company website', 'tech landing page'],
    },
    he: {
      title: 'אתרים לטכנולוגיה ו-SaaS',
      description: 'דפי נחיתה ואתרים ממירים לסטארטאפים ומוצרי SaaS.',
      keywords: ['אתר סטארטאפ', 'דף נחיתה', 'אתר טכנולוגיה'],
    },
  },
  arts: {
    en: {
      title: 'Arts & Crafts E-commerce',
      description: 'Beautiful online stores for artists, creators, and craftspeople. Showcase your work and sell directly to fans.',
      keywords: ['artist website', 'crafts e-commerce', 'art store online', 'handmade shop', 'creator store'],
    },
    he: {
      title: 'חנויות לאמנות ויצירה',
      description: 'חנויות אונליין יפהפיות לאמנים, יוצרים ובעלי מלאכה.',
      keywords: ['אתר אמנים', 'חנות יצירות', 'מכירת אמנות אונליין'],
    },
  },
  local: {
    en: {
      title: 'Local Business Websites',
      description: 'Professional websites for small and medium businesses ready to grow online. Local SEO optimized.',
      keywords: ['local business website', 'small business website', 'SMB website', 'local SEO', 'business website design'],
    },
    he: {
      title: 'אתרים לעסקים מקומיים',
      description: 'אתרים מקצועיים לעסקים קטנים ובינוניים שמוכנים לצמוח אונליין.',
      keywords: ['אתר לעסק קטן', 'אתר עסקי', 'עסק מקומי'],
    },
  },
};

export async function generateStaticParams() {
  const locales = ['en', 'he'];
  return locales.flatMap(locale =>
    INDUSTRIES.map(industry => ({ locale, industry }))
  );
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { locale, industry } = await params;
  const meta = INDUSTRY_META[industry as IndustrySlug]?.[locale as 'en' | 'he'] || INDUSTRY_META.fashion.en;

  return genMeta({
    title: meta.title,
    description: meta.description,
    url: `/industries/${industry}`,
    keywords: meta.keywords,
  }, locale as 'en' | 'he');
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { locale, industry } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const meta = INDUSTRY_META[industry as IndustrySlug]?.[locale as 'en' | 'he'] || INDUSTRY_META.fashion.en;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Industries', url: '/' },
    { name: meta.title, url: `/industries/${industry}` },
  ]);

  const serviceSchema = generateServiceSchema(
    `${meta.title} Development`,
    meta.description,
    { url: `/industries/${industry}` }
  );

  return (
    <>
      <Script
        id="industry-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="industry-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <IndustryPageContent industry={industry as IndustrySlug} />
    </>
  );
}
