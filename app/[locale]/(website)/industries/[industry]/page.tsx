import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Script from 'next/script';
import { IndustryPageContent } from '@/components/sections/IndustryPageContent';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateServiceSchema,
} from '@/lib/seo';

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
      description:
        'Product discovery, mobile merchandising and buying flows tailored to fashion and apparel stores. Shopify-first implementation where it fits.',
      keywords: [
        'fashion e-commerce',
        'clothing store website',
        'apparel Shopify',
        'fashion online store',
        'fashion brand website',
      ],
    },
    he: {
      title: 'חנויות אופנה',
      description: 'מייעלים מציאת מוצרים, הצגת מידות ותהליך רכישה למותגי אופנה, עם פתרונות Shopify בהתאם לצורך.',
      keywords: ['חנות אופנה אונליין', 'אתר ביגוד', 'מותג אופנה'],
    },
  },
  food: {
    en: {
      title: 'Food & Beverage Websites',
      description:
        'Clearer digital ordering journeys, product and menu information, and integrations for food brands and hospitality teams.',
      keywords: [
        'restaurant website',
        'food ordering system',
        'digital menu',
        'restaurant Shopify',
        'cafe website',
      ],
    },
    he: {
      title: 'אתרים למזון ומשקאות',
      description: 'שיפור תהליך הזמנה מקוון, הצגת תפריטים ומוצרים ואינטגרציות מתאימות לעסקי מזון ואירוח.',
      keywords: ['אתר מסעדה', 'הזמנות אונליין', 'תפריט דיגיטלי'],
    },
  },
  health: {
    en: {
      title: 'Health & Wellness E-commerce',
      description:
        'Useful product information, trust cues and clearer buying experiences for wellness and health-related commerce, with attention to sensitive claims.',
      keywords: [
        'health e-commerce',
        'supplements store',
        'wellness website',
        'fitness e-commerce',
        'health brand website',
      ],
    },
    he: {
      title: 'חנויות בריאות ואיכות חיים',
      description: 'חוויית קנייה ברורה ומידע מוצר מדויק למותגי בריאות ואיכות חיים, תוך זהירות בטענות רגישות.',
      keywords: ['חנות תוספי תזונה', 'אתר בריאות', 'חנות כושר'],
    },
  },
  tech: {
    en: {
      title: 'Tech & SaaS Websites',
      description:
        'Product-focused websites and landing pages that clarify complex software offerings and guide users to relevant next steps.',
      keywords: [
        'SaaS website',
        'tech startup website',
        'landing page design',
        'software company website',
        'tech landing page',
      ],
    },
    he: {
      title: 'אתרים לטכנולוגיה ו-SaaS',
      description: 'אתרי מוצר ודפי נחיתה שמסבירים פתרונות טכנולוגיים מורכבים ומקלים על יצירת קשר.',
      keywords: ['אתר סטארטאפ', 'דף נחיתה', 'אתר טכנולוגיה'],
    },
  },
  arts: {
    en: {
      title: 'Arts & Crafts E-commerce',
      description:
        'Portfolios, creator-led storefronts and clear paths from discovering work to making an inquiry or purchase.',
      keywords: [
        'artist website',
        'crafts e-commerce',
        'art store online',
        'handmade shop',
        'creator store',
      ],
    },
    he: {
      title: 'חנויות לאמנות ויצירה',
      description: 'תיקי עבודות וחנויות ליוצרים עם דרך ברורה מהיכרות עם העבודה לפנייה או רכישה.',
      keywords: ['אתר אמנים', 'חנות יצירות', 'מכירת אמנות אונליין'],
    },
  },
  local: {
    en: {
      title: 'Local Business Websites',
      description:
        'Maintainable websites for local businesses, with clear service information, accessible contact paths and practical local-search foundations.',
      keywords: [
        'local business website',
        'small business website',
        'SMB website',
        'local SEO',
        'business website design',
      ],
    },
    he: {
      title: 'אתרים לעסקים מקומיים',
      description: 'אתרים נוחים לתחזוקה לעסקים מקומיים עם שירותים ברורים, יצירת קשר נגישה ותשתית SEO מקומי.',
      keywords: ['אתר לעסק קטן', 'אתר עסקי', 'עסק מקומי'],
    },
  },
};

export async function generateStaticParams() {
  return routing.locales.flatMap(locale => INDUSTRIES.map(industry => ({ locale, industry })));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { locale, industry } = await params;
  const meta =
    INDUSTRY_META[industry as IndustrySlug]?.[locale as 'en' | 'he'] || INDUSTRY_META.fashion.en;

  return genMeta(
    {
      title: meta.title,
      description: meta.description,
      url: `/industries/${industry}`,
      keywords: meta.keywords,
    },
    locale as 'en' | 'he'
  );
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { locale, industry } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const meta =
    INDUSTRY_META[industry as IndustrySlug]?.[locale as 'en' | 'he'] || INDUSTRY_META.fashion.en;

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'he' ? 'בית' : 'Home', url: '/' },
      { name: locale === 'he' ? 'תעשיות' : 'Industries', url: '/' },
      { name: meta.title, url: `/industries/${industry}` },
    ],
    locale as 'en' | 'he'
  );

  const serviceSchema = generateServiceSchema(meta.title, meta.description, {
    url: `/industries/${industry}`,
    locale: locale as 'en' | 'he',
  });

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
