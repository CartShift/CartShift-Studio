export type PortfolioLocale = 'en' | 'he';

export type ShowcaseMedia = {
  src: string;
  alt: string;
  caption: string;
  label: string;
  aspect?: 'wide' | 'portrait';
  contain?: boolean;
};

export type PortfolioShowcaseProject = {
  slug: string;
  number: string;
  title: string;
  descriptor: string;
  year: string;
  updatedAt: string;
  status?: string;
  summary: string;
  audience: string;
  role: string;
  technologies: string[];
  highlights: string[];
  accent: string;
  accentSoft: string;
  hero: ShowcaseMedia | null;
  gallery: ShowcaseMedia[];
  liveUrl?: string;
  repositoryUrl?: string;
};

type LocalizedProject = {
  base: Omit<PortfolioShowcaseProject, 'summary' | 'audience' | 'role' | 'highlights' | 'hero' | 'gallery' | 'descriptor' | 'status'> & {
    media: {
      en: { hero: ShowcaseMedia | null; gallery: ShowcaseMedia[] };
      he?: { hero: ShowcaseMedia | null; gallery: ShowcaseMedia[] };
    };
  };
  en: Pick<PortfolioShowcaseProject, 'descriptor' | 'summary' | 'audience' | 'role' | 'highlights' | 'status'>;
  he: Pick<PortfolioShowcaseProject, 'descriptor' | 'summary' | 'audience' | 'role' | 'highlights' | 'status'>;
};

const projects: LocalizedProject[] = [
  {
    base: {
      slug: 'starlinker',
      number: '01',
      title: 'StarLinker',
      year: '2026',
      updatedAt: '2026-09-20',
      technologies: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Drizzle', 'Replicache', 'Supabase', 'AI SDK'],
      accent: '#7367f0',
      accentSoft: '#d8d3ff',
      liveUrl: 'https://starlinker.io',
      media: {
        en: {
          hero: {
            src: '/images/cv/portfolio/starlinker-en-light.png',
            alt: 'StarLinker visual planning workspace',
            label: 'Workspace',
            caption: 'A connected visual workspace for goals, projects, tasks, habits and notes.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [
            {
              src: '/images/cv/portfolio/starlinker-en-dark.png',
              alt: 'StarLinker dark workspace interface',
              label: 'Dark workspace',
              caption: 'The same planning environment remains clear and focused across themes.',
              aspect: 'wide',
              contain: true,
            },
          ],
        },
      },
    },
    en: {
      descriptor: 'AI-native productivity',
      status: 'Founder product',
      summary: 'A visual planning product that brings goals, projects, tasks, habits and notes into one connected workspace, with an AI agent that can understand and act inside it.',
      audience: 'People who think spatially and want one place to plan work, life and long-term goals without reducing everything to disconnected lists.',
      role: 'Founder · Product concept · UX · Architecture · Full-stack · AI',
      highlights: ['Graph-first workspace with offline-capable sync', 'Permission-aware AI actions with undo', 'Realtime collaboration, billing and operational tooling'],
    },
    he: {
      descriptor: 'פרודוקטיביות AI-native',
      status: 'מוצר founder-led',
      summary: 'מוצר תכנון ויזואלי שמחבר מטרות, פרויקטים, משימות, הרגלים והערות לסביבת עבודה אחת, עם סוכן AI שמבין את המרחב ויכול לפעול בתוכו.',
      audience: 'לאנשים שחושבים בצורה ויזואלית ורוצים מקום אחד לתכנן עבודה, חיים ומטרות ארוכות טווח בלי להפוך הכל לרשימות מנותקות.',
      role: 'Founder · קונספט מוצר · UX · ארכיטקטורה · Full-stack · AI',
      highlights: ['סביבת graph עם sync שתומך בעבודה offline', 'פעולות AI עם הרשאות ו-undo', 'שיתוף בזמן אמת, billing וכלים תפעוליים'],
    },
  },
  {
    base: {
      slug: 'rightflow',
      number: '02',
      title: 'RightFlow',
      year: '2025-26',
      technologies: ['Next.js', 'React', 'TypeScript', 'Python', 'FastAPI', 'Firebase'],
      accent: '#2563eb',
      accentSoft: '#cbdcfb',
      liveUrl: 'https://right-flow.com',
      media: {
        en: {
          hero: {
            src: '/images/cv/portfolio/rightflow-en-light.png',
            alt: 'RightFlow document verification interface',
            label: 'Verification workspace',
            caption: 'A structured workspace for document-heavy pension and payroll verification.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [
            {
              src: '/images/cv/portfolio/rightflow-en-dark.png',
              alt: 'RightFlow dark document review interface',
              label: 'Review flow',
              caption: 'Dense verification work stays legible through a focused review interface.',
              aspect: 'wide',
              contain: true,
            },
          ],
        },
        he: {
          hero: {
            src: '/images/cv/portfolio/rightflow-he-light.png',
            alt: 'ממשק אימות המסמכים של RightFlow',
            label: 'סביבת אימות',
            caption: 'סביבת עבודה מובנית לבדיקת מסמכי פנסיה ושכר.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [
            {
              src: '/images/cv/portfolio/rightflow-he-dark.png',
              alt: 'ממשק סקירת מסמכים כהה של RightFlow',
              label: 'תהליך סקירה',
              caption: 'תהליכי בדיקה צפופים נשארים ברורים בתוך ממשק סקירה ממוקד.',
              aspect: 'wide',
              contain: true,
            },
          ],
        },
      },
    },
    en: {
      descriptor: 'Document intelligence',
      status: 'Founder product',
      summary: 'A document review and verification platform for pension and payroll contribution checks, turning sensitive multi-document work into a structured, repeatable workflow.',
      audience: 'Finance, payroll and operations teams that need to review contribution documents consistently, explain findings clearly and export a usable report.',
      role: 'Founder · Product · Workflow design · Automation · Full-stack',
      highlights: ['Structured document review', 'Verification and exception handling', 'Repeatable report-ready workflow'],
    },
    he: {
      descriptor: 'Document intelligence',
      status: 'מוצר founder-led',
      summary: 'פלטפורמת בדיקה ואימות מסמכים להפקדות פנסיה ושכר, שהופכת עבודה רגישה ורבת מסמכים לתהליך מובנה, עקבי וניתן לחזרה.',
      audience: 'לצוותי כספים, שכר ותפעול שצריכים לבדוק מסמכי הפקדות באופן עקבי, להסביר ממצאים בצורה ברורה ולהפיק דוח שימושי.',
      role: 'Founder · מוצר · תכנון workflow · אוטומציה · Full-stack',
      highlights: ['סקירת מסמכים מובנית', 'אימות וטיפול בחריגות', 'תהליך עקבי שמוביל לדוח'],
    },
  },
  {
    base: {
      slug: 'ensemblis',
      number: '03',
      title: 'Ensemblis',
      year: '2026',
      technologies: ['Next.js', 'React', 'TypeScript', 'AI workflows', 'Media APIs', 'Automation'],
      accent: '#9b72f2',
      accentSoft: '#ddd0ff',
      media: {
        en: { hero: null, gallery: [] },
      },
    },
    en: {
      descriptor: 'Artist operating system',
      status: 'In development',
      summary: 'An AI-assisted operating system for independent artists that brings release planning, content creation, media intelligence, marketing workflows and distribution operations into one product.',
      audience: 'Independent artists and small teams who currently run releases, content, media and distribution across too many disconnected tools.',
      role: 'Founder · Product concept · Product design · AI systems · Full-stack',
      highlights: ['Release operations', 'Content and media intelligence', 'Marketing and distribution workflows'],
    },
    he: {
      descriptor: 'מערכת הפעלה לאמנים',
      status: 'בפיתוח',
      summary: 'מערכת הפעלה בסיוע AI לאמנים עצמאיים שמחברת תכנון ריליסים, יצירת תוכן, מודיעין מדיה, תהליכי שיווק ותפעול הפצה למוצר אחד.',
      audience: 'לאמנים עצמאיים וצוותים קטנים שמנהלים כיום ריליסים, תוכן, מדיה והפצה בין יותר מדי כלים מנותקים.',
      role: 'Founder · קונספט מוצר · Product design · מערכות AI · Full-stack',
      highlights: ['תפעול ריליסים', 'תוכן ומודיעין מדיה', 'תהליכי שיווק והפצה'],
    },
  },
  {
    base: {
      slug: 'wakemyway',
      number: '04',
      title: 'WakeMyWay',
      year: '2026',
      technologies: ['Kotlin', 'Jetpack Compose', 'AlarmManager', 'On-device Speech', 'Roborazzi', 'GitHub Actions'],
      accent: '#ff8b5f',
      accentSoft: '#ffd7c6',
      repositoryUrl: 'https://github.com/yotamon/WakeMyWay',
      media: {
        en: {
          hero: {
            src: 'https://raw.githubusercontent.com/yotamon/WakeMyWay/main/apps/android/app/src/test/screenshots/tonight_ready.png',
            alt: 'WakeMyWay ready state on Android',
            label: 'Tonight',
            caption: 'The night-before state prepares tomorrow without adding cognitive load.',
            aspect: 'portrait',
            contain: true,
          },
          gallery: [
            {
              src: 'https://raw.githubusercontent.com/yotamon/WakeMyWay/main/apps/android/app/src/test/screenshots/tonight_empty.png',
              alt: 'WakeMyWay empty Tonight screen',
              label: 'Night-before setup',
              caption: 'A calm entry point for preparing the next wake session.',
              aspect: 'portrait',
              contain: true,
            },
            {
              src: 'https://raw.githubusercontent.com/yotamon/WakeMyWay/main/apps/android/app/src/test/screenshots/wake_setup_weekly.png',
              alt: 'WakeMyWay weekly alarm setup',
              label: 'Schedule',
              caption: 'Native schedule controls keep the critical alarm path explicit and predictable.',
              aspect: 'portrait',
              contain: true,
            },
            {
              src: 'https://raw.githubusercontent.com/yotamon/WakeMyWay/main/apps/android/app/src/test/screenshots/wake_emerging.png',
              alt: 'WakeMyWay active wake screen',
              label: 'Active wake',
              caption: 'The active wake experience combines voice, movement cues and a deliberately low-load interface.',
              aspect: 'portrait',
              contain: true,
            },
          ],
        },
      },
    },
    en: {
      descriptor: 'Adaptive Android alarm',
      status: 'Founder dogfood',
      summary: 'A local-first conversational Android alarm designed to help people move through sleep inertia into action, then learn which wake strategy works best for them.',
      audience: 'People who genuinely want to get up at a chosen time but need something smarter than a louder sound or another generic alarm challenge.',
      role: 'Founder · Product · Android architecture · UX · Kotlin',
      highlights: ['Reliability-first native alarm', 'Local conversational wake', 'Physical activation signals and local learning'],
    },
    he: {
      descriptor: 'שעון מעורר אדפטיבי ל-Android',
      status: 'Founder dogfood',
      summary: 'שעון מעורר שיחתי local-first ל-Android שנועד לעזור לעבור מאינרציית שינה לפעולה, ובהמשך ללמוד איזו אסטרטגיית השכמה עובדת הכי טוב לכל אדם.',
      audience: 'לאנשים שבאמת רוצים לקום בשעה שבחרו, אבל צריכים משהו חכם יותר מצליל חזק יותר או עוד משימת השכמה גנרית.',
      role: 'Founder · מוצר · ארכיטקטורת Android · UX · Kotlin',
      highlights: ['Alarm native עם עדיפות לאמינות', 'השכמה שיחתית מקומית', 'אותות תנועה ולמידה מקומית'],
    },
  },
  {
    base: {
      slug: 'cartshift-studio',
      number: '05',
      title: 'CartShift Studio',
      year: '2025-26',
      technologies: ['Next.js', 'React', 'TypeScript', 'Firebase', 'PayPal', 'Puppeteer'],
      accent: '#6157d8',
      accentSoft: '#d7d2ff',
      liveUrl: 'https://cart-shift.com/en',
      repositoryUrl: 'https://github.com/CartShift/CartShift-Studio',
      media: {
        en: {
          hero: {
            src: '/images/cv/portfolio/cartshift-en-light.png',
            alt: 'CartShift Studio product and client operations interface',
            label: 'Studio platform',
            caption: 'A public studio, lead engine and client operations platform built as one evolving product.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [
            {
              src: '/images/cv/portfolio/cartshift-en-dark.png',
              alt: 'CartShift Studio dark interface',
              label: 'Product surface',
              caption: 'The platform connects acquisition, delivery and internal operations without splitting them into separate systems.',
              aspect: 'wide',
              contain: true,
            },
          ],
        },
        he: {
          hero: {
            src: '/images/cv/portfolio/cartshift-he-light.png',
            alt: 'ממשק הפלטפורמה של CartShift Studio',
            label: 'פלטפורמת הסטודיו',
            caption: 'אתר ציבורי, מנוע לידים ותפעול לקוחות כמוצר אחד שמתפתח באופן רציף.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [
            {
              src: '/images/cv/portfolio/cartshift-he-dark.png',
              alt: 'ממשק כהה של CartShift Studio',
              label: 'משטח מוצר',
              caption: 'הפלטפורמה מחברת acquisition, delivery ותפעול פנימי בלי לפצל אותם למערכות נפרדות.',
              aspect: 'wide',
              contain: true,
            },
          ],
        },
      },
    },
    en: {
      descriptor: 'Commerce + product engineering',
      status: 'Active product',
      summary: 'The operating platform behind my web and commerce studio, combining the public site, lead generation, project proposals, client workflows, automation and internal tools.',
      audience: 'Clients buying digital product work and the studio team managing acquisition, proposals, delivery and ongoing relationships.',
      role: 'Founder · Product · UX · Architecture · Full-stack',
      highlights: ['Lead and store analysis funnels', 'Proposals and client workflows', 'Commerce, automation and studio operations'],
    },
    he: {
      descriptor: 'Commerce + product engineering',
      status: 'מוצר פעיל',
      summary: 'הפלטפורמה התפעולית מאחורי סטודיו ה-web וה-commerce שלי, שמחברת אתר ציבורי, יצירת לידים, הצעות עבודה, תהליכי לקוח, אוטומציות וכלים פנימיים.',
      audience: 'ללקוחות שרוכשים עבודת מוצר דיגיטלית ולצוות הסטודיו שמנהל acquisition, הצעות, delivery וקשר מתמשך.',
      role: 'Founder · מוצר · UX · ארכיטקטורה · Full-stack',
      highlights: ['פאנלים ללידים וניתוח חנויות', 'הצעות עבודה ותהליכי לקוח', 'Commerce, אוטומציה ותפעול סטודיו'],
    },
  },
];

export const portfolioShowcaseSlugs = projects.map(project => project.base.slug);

export function getPortfolioShowcases(locale: string): PortfolioShowcaseProject[] {
  const resolvedLocale: PortfolioLocale = locale === 'he' ? 'he' : 'en';

  return projects.map(project => {
    const copy = project[resolvedLocale];
    const media = project.base.media[resolvedLocale] ?? project.base.media.en;

    return {
      ...project.base,
      ...copy,
      hero: media.hero,
      gallery: media.gallery,
    };
  });
}

export function getPortfolioShowcase(slug: string, locale: string): PortfolioShowcaseProject | null {
  return getPortfolioShowcases(locale).find(project => project.slug === slug) ?? null;
}

export function getNextPortfolioShowcase(slug: string, locale: string): PortfolioShowcaseProject | null {
  const localized = getPortfolioShowcases(locale);
  const index = localized.findIndex(project => project.slug === slug);
  if (index < 0) return null;
  return localized[(index + 1) % localized.length] ?? null;
}
