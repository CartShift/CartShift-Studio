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

const GERMAN_INDUSTRY_META: Record<IndustrySlug, IndustryMeta> = {
  fashion: {
    title: 'E-Commerce für Mode und Bekleidung',
    description: 'Produktsuche, mobile Produktpräsentation und Kaufprozesse für Mode- und Bekleidungsgeschäfte – mit Shopify, wenn es zur Aufgabe passt.',
    keywords: ['Mode-E-Commerce', 'Onlineshop für Bekleidung', 'Shopify für Modemarken', 'Fashion-Onlineshop', 'Website für Modemarken'],
  },
  food: {
    title: 'Websites für Gastronomie und Lebensmittel',
    description: 'Übersichtliche Online-Bestellprozesse, Produkt- und Speisekarteninformationen sowie Integrationen für Lebensmittelmarken und Gastronomiebetriebe.',
    keywords: ['Restaurant-Website', 'Online-Bestellsystem', 'digitale Speisekarte', 'Shopify für Gastronomie', 'Café-Website'],
  },
  health: {
    title: 'E-Commerce für Gesundheit und Wellness',
    description: 'Verständliche Produktinformationen, Vertrauenssignale und klare Kaufprozesse für Gesundheits- und Wellnessangebote – mit besonderer Sorgfalt bei sensiblen Werbeaussagen.',
    keywords: ['Gesundheits-E-Commerce', 'Onlineshop für Nahrungsergänzung', 'Wellness-Website', 'Fitness-Onlineshop', 'Website für Gesundheitsmarken'],
  },
  tech: {
    title: 'Websites für Technologie und SaaS',
    description: 'Produktorientierte Websites und Landingpages, die komplexe Softwareangebote verständlich machen und Nutzern sinnvolle nächste Schritte zeigen.',
    keywords: ['SaaS-Website', 'Website für Tech-Startups', 'Landingpage-Design', 'Softwareunternehmen Website', 'Technologie-Landingpage'],
  },
  arts: {
    title: 'E-Commerce für Kunst und Handwerk',
    description: 'Portfolios und Onlineshops für Kreative, die von der Entdeckung ihrer Arbeiten bis zur Anfrage oder zum Kauf einen klaren Weg bieten.',
    keywords: ['Künstler-Website', 'Onlineshop für Kunsthandwerk', 'Kunst online verkaufen', 'Handmade-Onlineshop', 'Shop für Kreative'],
  },
  local: {
    title: 'Websites für lokale Unternehmen',
    description: 'Wartbare Websites für lokale Betriebe – mit verständlichen Leistungsinformationen, gut erreichbaren Kontaktmöglichkeiten und einer soliden Grundlage für lokale Suchmaschinenoptimierung.',
    keywords: ['Website für lokale Unternehmen', 'Website für kleine Betriebe', 'KMU-Website', 'lokales SEO', 'Unternehmenswebsite'],
  },
};

function getIndustryMeta(industry: string, locale: string): IndustryMeta {
  const slug = (INDUSTRIES as readonly string[]).includes(industry) ? industry as IndustrySlug : 'fashion';
  return locale === 'de'
    ? GERMAN_INDUSTRY_META[slug]
    : INDUSTRY_META[slug][locale === 'he' ? 'he' : 'en'];
}

export async function generateStaticParams() {
  return routing.locales.filter(locale => locale !== 'de').flatMap(locale => INDUSTRIES.map(industry => ({ locale, industry })));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { locale, industry } = await params;
  const meta = getIndustryMeta(industry, locale);

  return genMeta(
    {
      title: meta.title,
      description: meta.description,
      url: `/industries/${industry}`,
      keywords: meta.keywords,
    },
    locale as 'en' | 'he' | 'de'
  );
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { locale, industry } = await params;
  setRequestLocale(locale as 'en' | 'he' | 'de');

  const meta = getIndustryMeta(industry, locale);

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: locale === 'he' ? 'בית' : locale === 'de' ? 'Startseite' : 'Home', url: '/' },
      { name: locale === 'he' ? 'תעשיות' : locale === 'de' ? 'Branchen' : 'Industries', url: '/' },
      { name: meta.title, url: `/industries/${industry}` },
    ],
    locale as 'en' | 'he' | 'de'
  );

  const serviceSchema = generateServiceSchema(meta.title, meta.description, {
    url: `/industries/${industry}`,
    locale: locale as 'en' | 'he' | 'de',
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
