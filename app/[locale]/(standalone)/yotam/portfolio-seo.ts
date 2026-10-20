import type { Metadata } from 'next';

type Locale = 'en' | 'he';
type Section = 'home' | 'work' | 'experience' | 'about' | 'contact';

const pageCopy: Record<Locale, Record<Section, { title: string; description: string }>> = {
  en: {
    home: { title: 'Yotam Faraggi | Independent Product Engineer in Berlin',
      description: 'Meet Yotam Faraggi, a Berlin-based senior product engineer and full-stack developer building thoughtful digital products, commerce systems and original experiences.' },
    work: { title: 'Selected Work | Yotam Faraggi',
      description: 'Explore selected product engineering, full-stack, and digital commerce projects developed by Yotam Faraggi.' },
    experience: { title: 'Professional Experience | Yotam Faraggi',
      description: 'Professional experience of Yotam Faraggi across product engineering, full-stack development, fintech, healthcare and commerce.' },
    about: { title: 'About | Yotam Faraggi',
      description: 'Meet Yotam Faraggi, a Berlin-based independent product engineer combining thoughtful design, complex engineering and hands-on delivery.' },
    contact: { title: 'Contact | Yotam Faraggi',
      description: 'Get in touch with Yotam Faraggi about full-stack engineering, product development, digital commerce and creative technology.' },
  },
  he: {
    home: { title: 'יותם פרג׳י | מהנדס מוצר עצמאי בברלין',
      description: 'הכירו את יותם פרג׳י, מהנדס מוצר בכיר ומפתח Full-Stack עצמאי בברלין שמפתח מוצרים דיגיטליים ומערכות מורכבות.' },
    work: { title: 'עבודות נבחרות | יותם פרג׳י',
      description: 'עבודות ופרויקטים נבחרים של יותם פרג׳י בתחום הנדסת מוצר, Full-Stack ומסחר דיגיטלי.' },
    experience: { title: 'ניסיון מקצועי | יותם פרג׳י',
      description: 'הניסיון המקצועי של יותם פרג׳י בפיתוח מוצר, Full-Stack, פינטק, בריאות ומסחר דיגיטלי.' },
    about: { title: 'עליי | יותם פרג׳י',
      description: 'על יותם פרג׳י, מהנדס מוצר עצמאי בברלין המשלב הנדסה, חשיבה מוצרית ויצירתיות.' },
    contact: { title: 'יצירת קשר | יותם פרג׳י',
      description: 'יצירת קשר עם יותם פרג׳י לפיתוח Full-Stack, מוצרים דיגיטליים, אינטגרציות ושיתופי פעולה.' },
  },
};

export function yotamMetadata(locale: Locale, section: Section): Metadata {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com').replace(/\/$/, '');
  const path = '/yotam' + (section === 'home' ? '' : '/' + section);
  const copy = pageCopy[locale][section];
  const canonical = base + '/' + locale + path;
  return {
    title: { absolute: copy.title },
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        en: base + '/en' + path,
        he: base + '/he' + path,
        'x-default': base + '/en' + path,
      },
    },
    openGraph: {
      type: 'profile',
      title: copy.title,
      description: copy.description,
      url: canonical,
      images: [{ url: base + '/images/portfolio-v2/hero-art.webp', alt: 'Yotam Faraggi portfolio' }],
    },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description },
  };
}
