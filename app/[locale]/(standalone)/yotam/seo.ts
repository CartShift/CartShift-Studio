import type { Metadata } from 'next';

type Locale = 'en' | 'he';
type Page = 'work' | 'experience' | 'about' | 'contact';

const content: Record<Locale, Record<Page, { title: string; description: string }>> = {
  en: {
    work: { title: 'Selected Work | Yotam Faraggi', description: 'Selected real projects in product engineering, digital commerce, software systems and creative development by Yotam Faraggi.' },
    experience: { title: 'Career Experience | Yotam Faraggi', description: 'Explore Yotam Faraggi’s career in full-stack engineering, product development, healthcare, fintech and commerce.' },
    about: { title: 'About | Yotam Faraggi', description: 'Meet Yotam Faraggi, a Berlin-based independent product engineer and full-stack developer.' },
    contact: { title: 'Contact | Yotam Faraggi', description: 'Contact Yotam Faraggi about full-stack development, product engineering, complex systems and creative digital projects.' },
  },
  he: {
    work: { title: 'עבודות נבחרות | יותם פרג׳י', description: 'פרויקטים נבחרים של יותם פרג׳י בפיתוח מוצרים, מסחר דיגיטלי ומערכות תוכנה.' },
    experience: { title: 'ניסיון מקצועי | יותם פרג׳י', description: 'המסלול המקצועי של יותם פרג׳י בפיתוח מוצר, Full-Stack, פינטק, בריאות ומסחר דיגיטלי.' },
    about: { title: 'קצת עליי | יותם פרג׳י', description: 'הכירו את יותם פרג׳י, מהנדס מוצר עצמאי ומפתח Full-Stack בברלין.' },
    contact: { title: 'יצירת קשר | יותם פרג׳י', description: 'דברו עם יותם פרג׳י על פיתוח מוצר, Full-Stack, אינטגרציות ופרויקטים יצירתיים.' },
  },
};

export function personalPageMetadata(locale: Locale, page: Page): Metadata {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com').replace(/\/$/, '');
  const copy = content[locale][page];
  const suffix = '/yotam/' + page;
  return {
    title: { absolute: copy.title },
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: base + '/' + locale + suffix,
      languages: {
        en: base + '/en' + suffix,
        he: base + '/he' + suffix,
        'x-default': base + '/en' + suffix,
      },
    },
    openGraph: {
      type: 'profile',
      title: copy.title,
      description: copy.description,
      url: base + '/' + locale + suffix,
    },
  };
}
