import type { Metadata } from 'next';

type Locale = 'en' | 'he';
type Section = 'home' | 'work' | 'experience' | 'about' | 'contact';

const descriptions: Record<Locale, Record<Section, { title: string; description: string }>> = {
  en: {
    home: {
      title: 'Yotam Faraggi — Independent Product Engineer',
      description: 'Yotam Faraggi is a Berlin-based independent product engineer and full-stack developer building thoughtful digital products, complex systems and original experiences.',
    },
    work: {
      title: 'Selected Work | Yotam Faraggi',
      description: 'Selected software, commerce and product engineering projects by Yotam Faraggi. Explore real product work, systems and implementation.',
    },
    experience: {
      title: 'Career Experience | Yotam Faraggi',
      description: 'Explore Yotam Faraggi’s professional experience across full-stack engineering, product development, healthcare, fintech and commerce.',
    },
    about: {
      title: 'About | Yotam Faraggi',
      description: 'Meet Yotam Faraggi, an independent product engineer based in Berlin with a thoughtful, hands-on approach to building software.',
    },
    contact: {
      title: 'Contact | Yotam Faraggi',
      description: 'Get in touch with Yotam Faraggi about product engineering, full-stack development, complex integrations and creative digital work.',
    },
  },
  he: {
    home: {
      title: 'יותם פרג׳י — מהנדס מוצר עצמאי',
      description: 'יותם פרג׳י, מהנדס מוצר ומפתח Full-Stack עצמאי בברלין. בניית מוצרים דיגיטליים, מערכות מורכבות וחוויות מקוריות.',
    },
    work: {
      title: 'עבודות נבחרות | יותם פרג׳י',
      description: 'פרויקטים נבחרים של יותם פרג׳י בתחום פיתוח מוצרים, מערכות ומסחר דיגיטלי.',
    },
    experience: {
      title: 'ניסיון מקצועי | יותם פרג׳י',
      description: 'המסלול המקצועי של יותם פרג׳י בפיתוח מוצר, Full-Stack, פינטק, בריאות ומסחר דיגיטלי.',
    },
    about: {
      title: 'קצת עליי | יותם פרג׳י',
      description: 'הכירו את יותם פרג׳י, מהנדס מוצר עצמאי בברלין עם גישה יצירתית ומעשית לפיתוח תוכנה.',
    },
    contact: {
      title: 'יצירת קשר | יותם פרג׳י',
      description: 'דברו עם יותם פרג׳י על פיתוח מוצר, Full-Stack, אינטגרציות ופרויקטים דיגיטליים יצירתיים.',
    },
  },
};

export function portfolioMetadata(locale: Locale, section: Section): Metadata {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com').replace(/\/$/, '');
  const suffix = section === 'home' ? '' : '/portfolio-v5/' + section;
  const canonical = siteUrl + '/' + locale + suffix;
  const copy = descriptions[locale][section];
  return {
    title: { absolute: copy.title },
    description: copy.description,
    keywords: locale === 'he'
      ? ['יותם פרג׳י', 'מהנדס מוצר', 'פיתוח פול סטאק', 'פיתוח מוצרים דיגיטליים', 'ברלין']
      : ['Yotam Faraggi', 'Product Engineer', 'Full-Stack Developer', 'Creative Development', 'Berlin'],
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        en: siteUrl + '/en' + suffix,
        he: siteUrl + '/he' + suffix,
        'x-default': siteUrl + '/en' + suffix,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Yotam Faraggi',
      title: copy.title,
      description: copy.description,
      url: canonical,
      images: [{ url: siteUrl + '/images/portfolio-v2/hero-art.webp', width: 1200, height: 630, alt: 'Yotam Faraggi — Product Engineering' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [siteUrl + '/images/portfolio-v2/hero-art.webp'],
    },
  };
}
