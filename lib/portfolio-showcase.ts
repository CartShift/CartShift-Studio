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

export const portfolioShowcaseOrder = [
  'starlinker',
  'pileheads',
  'rightflow',
  'wakemyway',
  'cartshift-studio',
  'ensemblis',
] as const;

const portfolioShowcaseRank = new Map<string, number>(
  portfolioShowcaseOrder.map((slug, index) => [slug, index])
);

const projects: LocalizedProject[] = [
  {
    base: {
      slug: 'pileheads',
      number: '02',
      title: 'PILEHEADS',
      year: '2026',
      updatedAt: '2026-11-28',
      technologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'WebSockets', 'Neon PostgreSQL', 'Vercel'],
      accent: '#a43b29',
      accentSoft: '#f0d7b4',
      liveUrl: 'https://pileheads.com/play',
      repositoryUrl: 'https://github.com/CartShift/pileheads',
      media: {
        en: {
          hero: {
            src: '/images/cv/portfolio/pileheads-deck.webp',
            alt: 'Original PILEHEADS illustrated card faces arranged in a deck sprite sheet',
            label: 'Original card artwork',
            caption: 'Actual illustrated deck assets from the game, not a screenshot of the browser tabletop.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [{
            src: '/images/cv/portfolio/pileheads-back.webp',
            alt: 'PILEHEADS card back artwork from the game repository',
            label: 'Card back',
            caption: 'A card-back design from the physical and digital deck assets.',
            aspect: 'portrait',
            contain: true,
          }],
        },
        he: {
          hero: {
            src: '/images/cv/portfolio/pileheads-deck.webp',
            alt: 'איורי הקלפים המקוריים של PILEHEADS מסודרים בגיליון אחד',
            label: 'איורי קלפים מקוריים',
            caption: 'גרפיקות אמיתיות של חפיסת המשחק, ולא צילום מסך של ממשק המשחק בדפדפן.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [{
            src: '/images/cv/portfolio/pileheads-back.webp',
            alt: 'עיצוב גב קלף מתוך נכסי המשחק של PILEHEADS',
            label: 'גב הקלף',
            caption: 'עיצוב גב קלף מתוך נכסי החפיסה הפיזית והדיגיטלית.',
            aspect: 'portrait',
            contain: true,
          }],
        },
      },
    },
    en: {
      descriptor: 'Physical-first game · Real-time multiplayer',
      status: 'Active playtest product',
      summary: 'An original 54-card game and browser tabletop for 2–5 players, combining physical game design, bot opponents and private multiplayer around one deterministic rules engine.',
      audience: 'Friends and card-game players who want to share a fast, tactical tabletop experience in person or online.',
      role: 'Founder · Game design · Product & UX · Full-stack engineering',
      highlights: ['Server-authoritative moves, revision control and private player views', 'Shared deterministic rules engine with bots and seeded simulations', 'Responsive React tabletop with event-driven motion and WebSocket updates'],
    },
    he: {
      descriptor: 'משחק קלפים פיזי ודיגיטלי · מולטיפלייר בזמן אמת',
      status: 'מוצר פעיל בשלב Playtest',
      summary: 'משחק קלפים מקורי עם 54 קלפים ושולחן משחק בדפדפן ל-2–5 שחקנים, המשלב משחק פיזי, בוטים וחדרים פרטיים סביב מנוע חוקים דטרמיניסטי אחד.',
      audience: 'לחברים ולחובבי משחקי קלפים שרוצים חוויית משחק מהירה וטקטית, פנים אל פנים או אונליין.',
      role: 'Founder · עיצוב משחק · מוצר ו-UX · פיתוח Full-stack',
      highlights: ['אימות מהלכים בשרת, בקרת גרסאות והגנה על מידע פרטי של שחקנים', 'מנוע חוקים דטרמיניסטי משותף עם בוטים וסימולציות שחזור', 'שולחן React רספונסיבי עם אנימציות מבוססות אירועים ועדכוני WebSocket'],
    },
  },
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
      number: '03',
      title: 'RightFlow',
      year: '2025-26',
      updatedAt: '2026-09-20',
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
      highlights: ['Normalized multi-document review cases', 'Explicit exceptions and traceable findings', 'Repeatable report-ready verification workflow'],
    },
    he: {
      descriptor: 'Document intelligence',
      status: 'מוצר founder-led',
      summary: 'פלטפורמת בדיקה ואימות מסמכים להפקדות פנסיה ושכר, שהופכת עבודה רגישה ורבת מסמכים לתהליך מובנה, עקבי וניתן לחזרה.',
      audience: 'לצוותי כספים, שכר ותפעול שצריכים לבדוק מסמכי הפקדות באופן עקבי, להסביר ממצאים בצורה ברורה ולהפיק דוח שימושי.',
      role: 'Founder · מוצר · תכנון workflow · אוטומציה · Full-stack',
      highlights: ['תיקי בדיקה מנורמלים ממספר מסמכים', 'חריגות מפורשות וממצאים ניתנים למעקב', 'תהליך אימות עקבי שמוביל לדוח'],
    },
  },
  {
    base: {
      slug: 'ensemblis',
      number: '06',
      title: 'Ensemblis',
      year: '2026',
      updatedAt: '2026-09-20',
      technologies: ['Next.js', 'React', 'TypeScript', 'AI workflows', 'Media APIs', 'Automation'],
      accent: '#9b72f2',
      accentSoft: '#ddd0ff',
      media: {
        en: {
          hero: {
            src: '/images/cv/portfolio/ensemblis-editorial.svg',
            alt: 'Ensemblis editorial concept artwork with a vinyl record and music-release graphics, not a product screenshot',
            label: 'Editorial concept',
            caption: 'A visual direction for an artist operating system in development. Concept artwork, not an application screenshot.',
            aspect: 'wide',
            contain: true,
          },
          gallery: [],
        },
      },
    },
    en: {
      descriptor: 'Artist operating system',
      status: 'Product in development',
      summary: 'An AI-assisted operating system for independent artists that brings release planning, content creation, media intelligence, marketing workflows and distribution operations into one product.',
      audience: 'Independent artists and small teams who currently run releases, content, media and distribution across too many disconnected tools.',
      role: 'Founder · Product concept · Product design · AI systems · Full-stack',
      highlights: ['Release operations', 'Content and media intelligence', 'Marketing and distribution workflows'],
    },
    he: {
      descriptor: 'מערכת הפעלה לאמנים',
      status: 'מוצר בפיתוח',
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
      updatedAt: '2026-09-20',
      technologies: ['Kotlin', 'Jetpack Compose', 'AlarmManager', 'Direct Boot', 'On-device Speech', 'Roborazzi', 'GitHub Actions'],
      accent: '#ff8b5f',
      accentSoft: '#ffd7c6',
      repositoryUrl: 'https://github.com/yotamon/WakeMyWay',
      media: {
        en: {
          hero: {
            src: '/images/cv/portfolio/wakemyway-tonight_ready.png',
            alt: 'WakeMyWay ready state on Android from the earlier visual regression baseline',
            label: 'Tonight · earlier design',
            caption: 'An earlier visual regression capture of the night-before state; not the latest redesign.',
            aspect: 'portrait',
            contain: true,
          },
          gallery: [
            {
              src: '/images/cv/portfolio/wakemyway-tonight_empty.png',
              alt: 'WakeMyWay empty Tonight screen',
              label: 'Night-before setup',
              caption: 'Earlier visual regression capture of the night-before setup.',
              aspect: 'portrait',
              contain: true,
            },
            {
              src: '/images/cv/portfolio/wakemyway-wake_setup_weekly.png',
              alt: 'WakeMyWay weekly alarm setup',
              label: 'Schedule',
              caption: 'Earlier visual regression capture of native scheduling controls.',
              aspect: 'portrait',
              contain: true,
            },
            {
              src: '/images/cv/portfolio/wakemyway-wake_emerging.png',
              alt: 'WakeMyWay active wake screen',
              label: 'Active wake',
              caption: 'Earlier visual regression capture of the active wake experience.',
              aspect: 'portrait',
              contain: true,
            },
          ],
        },
      },
    },
    en: {
      descriptor: 'Adaptive Android alarm',
      status: 'Active personal product',
      summary: 'A local-first conversational Android alarm designed to help people move through sleep inertia into action, then learn which wake strategy works best for them.',
      audience: 'People who genuinely want to get up at a chosen time but need something smarter than a louder sound or another generic alarm challenge.',
      role: 'Founder · Product · Android architecture · UX · Kotlin',
      highlights: ['Exact native alarm with Direct Boot recovery', 'Deterministic local wake runtime with voice and motion', 'Local learning isolated from the critical alarm path'],
    },
    he: {
      descriptor: 'שעון מעורר אדפטיבי ל-Android',
      status: 'מוצר אישי פעיל',
      summary: 'שעון מעורר שיחתי local-first ל-Android שנועד לעזור לעבור מאינרציית שינה לפעולה, ובהמשך ללמוד איזו אסטרטגיית השכמה עובדת הכי טוב לכל אדם.',
      audience: 'לאנשים שבאמת רוצים לקום בשעה שבחרו, אבל צריכים משהו חכם יותר מצליל חזק יותר או עוד משימת השכמה גנרית.',
      role: 'Founder · מוצר · ארכיטקטורת Android · UX · Kotlin',
      highlights: ['Alarm native מדויק עם Direct Boot recovery', 'Wake runtime דטרמיניסטי עם קול ותנועה', 'למידה מקומית שמופרדת מנתיב ההשכמה הקריטי'],
    },
  },
  {
    base: {
      slug: 'cartshift-studio',
      number: '05',
      title: 'CartShift Studio',
      year: '2025-26',
      updatedAt: '2026-09-20',
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
      summary: 'The operating platform behind the web and commerce studio I co-founded, combining the public site, lead generation, project proposals, client workflows, automation and internal tools.',
      audience: 'Clients buying digital product work and the studio team managing acquisition, proposals, delivery and ongoing relationships.',
      role: 'Co-founder · Lead engineer · Product architecture · Full-stack',
      highlights: ['Lead and store-analysis funnels', 'Proposals, payments and client workflows', 'Client portal, automation and studio operations'],
    },
    he: {
      descriptor: 'Commerce + product engineering',
      status: 'מוצר פעיל',
      summary: 'הפלטפורמה התפעולית מאחורי סטודיו ה-web וה-commerce שהקמתי יחד עם שותפה, שמחברת אתר ציבורי, יצירת לידים, הצעות עבודה, תהליכי לקוח, אוטומציות וכלים פנימיים.',
      audience: 'ללקוחות שרוכשים עבודת מוצר דיגיטלית ולצוות הסטודיו שמנהל acquisition, הצעות, delivery וקשר מתמשך.',
      role: 'Co-founder · Lead engineer · ארכיטקטורת מוצר · Full-stack',
      highlights: ['פאנלים ללידים וניתוח חנויות', 'הצעות, תשלומים ותהליכי לקוח', 'פורטל לקוחות, אוטומציה ותפעול סטודיו'],
    },
  },
];

export const portfolioShowcaseSlugs = [...portfolioShowcaseOrder];

export function getPortfolioShowcases(locale: string): PortfolioShowcaseProject[] {
  const resolvedLocale: PortfolioLocale = locale === 'he' ? 'he' : 'en';

  return [...projects]
    .sort(
      (a, b) =>
        (portfolioShowcaseRank.get(a.base.slug) ?? Number.MAX_SAFE_INTEGER) -
        (portfolioShowcaseRank.get(b.base.slug) ?? Number.MAX_SAFE_INTEGER)
    )
    .map(project => {
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
