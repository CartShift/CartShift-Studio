import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { generateMetadata as createSeoMetadata } from '@/lib/seo';

type Locale = 'en' | 'he';
type ServiceSlug = 'shopify-conversion-optimization' | 'shopify-b2b-integrations' | 'shopify-performance-seo';

interface ServiceContent {
  title: string;
  description: string;
  eyebrow: string;
  introduction: string;
  problemsHeading: string;
  problems: string[];
  workHeading: string;
  work: string[];
  processHeading: string;
  process: { title: string; text: string }[];
  faqHeading: string;
  faq: { question: string; answer: string }[];
  ctaHeading: string;
  ctaDescription: string;
  ctaLabel: string;
  backLabel: string;
}

const services: Record<ServiceSlug, Record<Locale, ServiceContent>> = {
  'shopify-conversion-optimization': {
    en: {
      title: 'Shopify Conversion Rate Optimization | CartShift Studio',
      description: 'Find and fix friction in your Shopify buying journey. Practical product-page, mobile, cart, and trust improvements based on evidence, not generic scores.',
      eyebrow: 'SHOPIFY CONVERSION OPTIMIZATION',
      introduction: 'More traffic does not automatically mean more orders. We inspect the path from product discovery to purchase, identify obstacles we can actually observe, and turn findings into a focused implementation plan. Start with a review before committing to a larger redesign.',
      problemsHeading: 'When a conversion review makes sense',
      problems: [
        'Shoppers visit product pages but struggle to understand variants, sizing, shipping, or availability.',
        'Mobile product pages bury the add-to-cart action or make critical product information hard to find.',
        'The cart introduces surprises, unclear feedback, or unnecessary steps before checkout.',
        'You have traffic but cannot tell which UX issues are worth fixing first.'
      ],
      workHeading: 'What we can examine and improve',
      work: [
        'Product-page information hierarchy, buying controls, and variant selection.',
        'Mobile navigation, merchandising, accessibility signals, and buying-flow clarity.',
        'Cart interactions and publicly observable checkout handoff. Checkout changes depend on Shopify capabilities and plan restrictions.',
        'Evidence-backed priorities, implementation scope, and validation with available analytics.'
      ],
      processHeading: 'How an engagement works',
      process: [
        { title: 'Review the real journey', text: 'We inspect representative products and paths on desktop and mobile. Any areas requiring privileged access are flagged, not guessed.' },
        { title: 'Prioritize practical fixes', text: 'We separate verified observations from hypotheses and estimate implementation effort before changing the store.' },
        { title: 'Build and validate', text: 'After approval, we implement scoped improvements and assess the result using suitable UX checks and available conversion data.' }
      ],
      faqHeading: 'Common questions',
      faq: [
        { question: 'Can you guarantee a conversion lift?', answer: 'No. Conversion is influenced by traffic quality, offer, pricing, and many other factors. We can identify friction, implement improvements, and measure outcomes when usable data exists.' },
        { question: 'Do you need Shopify admin access for the first review?', answer: 'No. The initial review uses public pages. We request access only if a deeper investigation or implementation requires it.' },
        { question: 'Do we need a new theme?', answer: 'Not necessarily. We prefer targeted, maintainable changes when they address the problem without an unnecessary rebuild.' }
      ],
      ctaHeading: 'Find the highest-impact friction first',
      ctaDescription: 'Tell us about your store. We will review the public customer journey and respond with a small number of prioritized observations.',
      ctaLabel: 'Request a free expert review',
      backLabel: 'Explore Shopify services'
    },
    he: {
      title: 'שיפור יחס המרה בחנויות Shopify | CartShift Studio',
      description: 'מזהים ומתקנים חיכוך בתהליך הקנייה בשופיפיי: דפי מוצר, מובייל, עגלה ואמון. המלצות מבוססות ממצאים ולא ציונים גנריים.',
      eyebrow: 'אופטימיזציית המרות לשופיפיי',
      introduction: 'יותר תנועה לא בהכרח מייצרת יותר הזמנות. אנחנו בודקים את מסלול הקנייה, מזהים בעיות שאפשר לראות ולהוכיח, ומגבשים תוכנית תיקון ממוקדת. אין צורך להתחייב לעיצוב מחדש לפני שמבינים מה באמת מפריע לקונים.',
      problemsHeading: 'מתי כדאי לבצע סקירת המרות?',
      problems: [
        'לקוחות מגיעים לדפי מוצר אבל מתקשים להבין אפשרויות, מידות, מלאי או משלוחים.',
        'במובייל כפתור הקנייה נעלם בתוך העמוד או שהמידע החשוב לא ברור.',
        'בעגלה יש הפתעות, חוסר בהירות או שלבים מיותרים.',
        'יש תנועה לחנות אבל לא ברור איזה שינוי בחוויית המשתמש כדאי לבצע קודם.'
      ],
      workHeading: 'מה נבדוק ומה אפשר לשפר?',
      work: [
        'היררכיית מידע בדפי מוצר, בחירת וריאנטים והוספה לעגלה.',
        'ניווט במובייל, הצגת מוצרים, נגישות ותחושת ביטחון בקנייה.',
        'התנהגות העגלה והמעבר לתשלום. שינויי Checkout כפופים ליכולות Shopify ולמגבלות התוכנית.',
        'סדר עדיפויות מבוסס ראיות, היקף יישום ואימות מול נתונים זמינים.'
      ],
      processHeading: 'איך עובדים איתנו?',
      process: [
        { title: 'סקירת מסלול הקנייה', text: 'בוחנים מוצרים מייצגים ומסלולים במחשב ובטלפון. כשנדרשת גישה פנימית מציינים זאת במקום לנחש.' },
        { title: 'בחירת תיקונים חכמים', text: 'מפרידים בין ממצא מאומת להשערה ומתכננים את היקף העבודה לפני שנוגעים בחנות.' },
        { title: 'פיתוח ואימות', text: 'לאחר אישור מיישמים שינויים ממוקדים ובודקים אותם באמצעות QA ונתוני המרה זמינים.' }
      ],
      faqHeading: 'שאלות נפוצות',
      faq: [
        { question: 'אתם מבטיחים שיפור באחוזי ההמרה?', answer: 'לא. ההמרות מושפעות גם ממחירים, הצעה עסקית, איכות התנועה ועוד. אנחנו יכולים למצוא חיכוך, לשפר את החוויה ולמדוד כשהנתונים מאפשרים זאת.' },
        { question: 'צריך לתת גישת מנהל לסקירה הראשונית?', answer: 'לא. מתחילים מעמודים ציבוריים ומבקשים הרשאות רק במידת הצורך ובהסכמה.' },
        { question: 'חייבים להחליף תבנית?', answer: 'ממש לא. כשאפשר לתקן בצורה ממוקדת ותחזוקתית, זה עדיף על בנייה מחדש ללא צורך.' }
      ],
      ctaHeading: 'נתחיל במה שהכי מפריע לקונים',
      ctaDescription: 'ספרו לנו על החנות שלכם. נבחן את מסלול הקנייה הציבורי ונחזור עם מספר ממצאים לפי סדר עדיפות.',
      ctaLabel: 'בקשת סקירה מקצועית בחינם',
      backLabel: 'לשירותי Shopify'
    }
  },
  'shopify-b2b-integrations': {
    en: {
      title: 'Shopify B2B & Custom Integrations | CartShift Studio',
      description: 'Practical Shopify B2B workflows, inventory synchronization, and custom integrations designed around real operational constraints and maintainability.',
      eyebrow: 'SHOPIFY B2B & INTEGRATIONS',
      introduction: 'Wholesale, inventory, and fulfillment requirements rarely fit a one-size-fits-all app. We begin with your operational process and Shopify plan capabilities, then evaluate native functionality, trusted apps, and small custom integrations in that order.',
      problemsHeading: 'Operational problems worth solving',
      problems: [
        'Wholesale customers need pricing, catalogs, or access rules beyond the standard storefront.',
        'Stock quantities must stay aligned across Shopify and an external warehouse or logistics partner.',
        'Orders require routing, status updates, or fulfillment steps that currently depend on manual work.',
        'A collection of apps and manual workarounds is becoming difficult to monitor and maintain.'
      ],
      workHeading: 'Our implementation principles',
      work: [
        'Map source-of-truth ownership, roles, data flows, and failure scenarios before choosing a tool.',
        'Prefer supported Shopify capabilities and clear platform constraints over brittle theme hacks.',
        'For integrations, design retries, idempotency, reconciliation, and alerts around real-world failures.',
        'Document operational handover, expected running costs, and where manual intervention remains necessary.'
      ],
      processHeading: 'From requirements to a reliable workflow',
      process: [
        { title: 'Discover the process', text: 'We document how orders, accounts, pricing, and inventory actually move between systems.' },
        { title: 'Choose the simplest reliable approach', text: 'We compare native Shopify features, existing integration platforms, and custom code before committing to an architecture.' },
        { title: 'Test failure paths and hand over', text: 'We validate representative scenarios, define monitoring, and document what the team should do when data does not match.' }
      ],
      faqHeading: 'Common questions',
      faq: [
        { question: 'Do we need Shopify Plus for B2B?', answer: 'Some native B2B capabilities depend on Shopify plan eligibility. We review your exact requirements and plan before proposing an approach.' },
        { question: 'Can Make or another automation platform be enough?', answer: 'Sometimes. The right choice depends on order volume, consistency needs, failure recovery, and subscription costs. We will not present an automation workaround as a native platform guarantee.' },
        { question: 'Can you promise inventory will never drift?', answer: 'No system is immune to upstream outages and conflicting changes. Good integrations include reconciliation, monitoring, and explicit ownership for exceptions.' }
      ],
      ctaHeading: 'Describe the workflow that is slowing you down',
      ctaDescription: 'Share your store and your operational challenge. We will identify the questions to resolve before proposing a technical solution.',
      ctaLabel: 'Request a free expert review',
      backLabel: 'Explore Shopify services'
    },
    he: {
      title: 'פתרונות Shopify B2B ואינטגרציות | CartShift Studio',
      description: 'פתרונות B2B, סנכרון מלאי ואינטגרציות מותאמות לשופיפיי המבוססים על התהליך העסקי שלכם, עם דגש על אמינות ותחזוקה.',
      eyebrow: 'SHOPIFY B2B ואינטגרציות',
      introduction: 'תהליכי סיטונאות, מלאי ושילוח לא תמיד מתאימים לאפליקציה אחת מוכנה. אנחנו מתחילים מהתהליך התפעולי ומהיכולות של תוכנית Shopify שלכם, ורק אז בוחנים פתרון מובנה, אפליקציה קיימת או פיתוח מותאם.',
      problemsHeading: 'בעיות תפעוליות שכדאי לפתור',
      problems: [
        'לקוחות סיטונאיים צריכים מחירים, קטלוגים או הרשאות שונות מהחנות הרגילה.',
        'כמויות המלאי צריכות להישאר מסונכרנות בין Shopify למחסן או ספק לוגיסטי.',
        'הזמנות דורשות ניתוב, שינוי סטטוס או טיפול ידני חוזר.',
        'אוסף אפליקציות ומעקפים הפך לקשה לתחזוקה ולמעקב.'
      ],
      workHeading: 'עקרונות הפיתוח שלנו',
      work: [
        'מגדירים מקור אמת, הרשאות, זרימת נתונים ותרחישי כשל לפני בחירת טכנולוגיה.',
        'מעדיפים יכולות Shopify נתמכות על פני מעקפים שבירים בתבנית.',
        'באינטגרציות מתכננים ניסיונות חוזרים, מניעת כפילויות, התאמות והתראות.',
        'מתעדים תפעול, עלויות שוטפות ומקרים שבהם עדיין דרוש טיפול אנושי.'
      ],
      processHeading: 'מדרישות למערכת שאפשר לסמוך עליה',
      process: [
        { title: 'ממפים את התהליך', text: 'מתעדים איך הזמנות, לקוחות, מחירים ומלאי עוברים בין המערכות בפועל.' },
        { title: 'בוחרים את הפתרון הפשוט והאמין', text: 'משווים יכולות מובנות, פלטפורמות אוטומציה וקוד מותאם לפני החלטה ארכיטקטונית.' },
        { title: 'בודקים גם תקלות', text: 'מאמתים תרחישים מייצגים, מגדירים ניטור ומסבירים לצוות מה לעשות כשנתונים אינם תואמים.' }
      ],
      faqHeading: 'שאלות נפוצות',
      faq: [
        { question: 'חייבים Shopify Plus בשביל B2B?', answer: 'חלק מיכולות ה־B2B המובנות תלויות בתוכנית Shopify. נבדוק את הדרישות והזכאות לפני שנמליץ על פתרון.' },
        { question: 'אפשר להסתפק ב־Make או אוטומציה דומה?', answer: 'לפעמים כן. זה תלוי בנפח הזמנות, צורך בעקביות נתונים, טיפול בתקלות ועלויות. לא נציג פתרון עוקף כהבטחה מובנית של Shopify.' },
        { question: 'אפשר להבטיח שהמלאי תמיד יהיה מסונכרן?', answer: 'לא. גם מערכות טובות מושפעות מתקלות ושינויים סותרים. לכן נדרשים ניטור, מנגנוני התאמה ובעלות ברורה על חריגות.' }
      ],
      ctaHeading: 'איזה תהליך גוזל לכם הכי הרבה זמן?',
      ctaDescription: 'שלחו את כתובת החנות ואת האתגר התפעולי. נגדיר מה צריך לברר לפני שמציעים פתרון.',
      ctaLabel: 'בקשת סקירה מקצועית בחינם',
      backLabel: 'לשירותי Shopify'
    }
  },
  'shopify-performance-seo': {
    en: {
      title: 'Shopify Technical SEO & Performance | CartShift Studio',
      description: 'Technical Shopify SEO and performance reviews covering indexability, canonical URLs, structured data, mobile experience, and the cost of heavy themes and apps.',
      eyebrow: 'SHOPIFY TECHNICAL SEO & PERFORMANCE',
      introduction: 'Search visibility and storefront speed share an important foundation: pages must be discoverable, understandable, and usable. We prioritize technical issues that affect real customer journeys before recommending expensive rebuilds or vague speed promises.',
      problemsHeading: 'Signals that deserve investigation',
      problems: [
        'Important product and collection URLs are missing from Google or appear under the wrong canonical.',
        'Variants, filters, language paths, or redirects create confusing duplicate URL signals.',
        'Third-party apps and scripts slow mobile interactions or disrupt product-page usability.',
        'SEO recommendations have accumulated, but nobody has verified which are real issues.'
      ],
      workHeading: 'What a focused technical review covers',
      work: [
        'Crawlability, indexability, canonicals, hreflang where applicable, sitemaps, and important redirects.',
        'Structured data that matches visible content and is supported by current search guidance.',
        'Core Web Vitals and loading behavior, with field data distinguished from lab simulations.',
        'Prioritized fixes and regression checks that preserve existing rankings and purchasing flows.'
      ],
      processHeading: 'A measurable technical approach',
      process: [
        { title: 'Collect evidence', text: 'We combine observable page behavior with Search Console, analytics, and performance data if you can provide access.' },
        { title: 'Separate impact from noise', text: 'We distinguish index-blocking issues from minor warnings and avoid treating every automated score as a business priority.' },
        { title: 'Fix and monitor', text: 'We implement agreed improvements, validate the URLs, and monitor search visibility and performance over time.' }
      ],
      faqHeading: 'Common questions',
      faq: [
        { question: 'Will fixing Core Web Vitals guarantee better Google rankings?', answer: 'No. Search performance depends on relevance, competition, site quality, and many signals. Performance improvements are valuable for users but do not guarantee ranking changes.' },
        { question: 'Should we install another SEO app?', answer: 'Only when it solves a verified problem. Many canonical, indexing, and structured-data issues are better addressed in the theme or site architecture.' },
        { question: 'Can you work without Search Console access?', answer: 'We can review public pages first, but impressions, queries, indexing details, and outcomes are much clearer with verified Search Console access.' }
      ],
      ctaHeading: 'Know what to fix before buying more tools',
      ctaDescription: 'Request a focused store review and we will identify the most useful next technical checks.',
      ctaLabel: 'Request a free expert review',
      backLabel: 'Explore Shopify services'
    },
    he: {
      title: 'SEO טכני ושיפור ביצועים בשופיפיי | CartShift Studio',
      description: 'סקירה טכנית של Shopify: אינדוקס, קנוניקל, נתונים מובנים, מובייל, מהירות וההשפעה של אפליקציות וסקריפטים.',
      eyebrow: 'SEO טכני וביצועים לשופיפיי',
      introduction: 'נראות בגוגל ומהירות החנות נשענות על בסיס משותף: גוגל צריך להבין את הדפים, והלקוחות צריכים להשתמש בהם בקלות. אנחנו מתמקדים קודם בתקלות המשפיעות על המסע האמיתי של הלקוח, ולא מבטיחים ציון מהירות קסום.',
      problemsHeading: 'סימנים שכדאי לבדוק',
      problems: [
        'דפי מוצר או קולקציות חשובים לא מופיעים בגוגל או משויכים לכתובת קנונית לא נכונה.',
        'וריאנטים, פילטרים, שפות והפניות יוצרים אותות כפולים ומבלבלים.',
        'אפליקציות וסקריפטים מאטים את המובייל ופוגעים בשימוש בדפי מוצר.',
        'הצטברו המלצות SEO, אבל לא ברור אילו מהן הן בעיות אמיתיות.'
      ],
      workHeading: 'מה כוללת סקירה טכנית ממוקדת?',
      work: [
        'סריקה, אינדוקס, canonical, hreflang כשצריך, מפת אתר והפניות חשובות.',
        'נתונים מובנים שתואמים למה שמוצג בדף ולהנחיות מנועי החיפוש.',
        'Core Web Vitals והתנהגות טעינה, תוך הבחנה בין נתוני שטח לסימולציות מעבדה.',
        'סדר עדיפויות ותיקונים עם בדיקות רגרסיה להגנה על הדירוגים וחוויית הקנייה.'
      ],
      processHeading: 'תהליך טכני שאפשר למדוד',
      process: [
        { title: 'אוספים ראיות', text: 'משלבים התנהגות גלויה של הדפים עם Search Console, אנליטיקה ונתוני ביצועים אם יש גישה.' },
        { title: 'מפרידים עיקר מטפל', text: 'מבחינים בין חסימות אינדוקס לאזהרות קטנות ולא מתייחסים לכל ציון אוטומטי כיעד עסקי.' },
        { title: 'מתקנים ועוקבים', text: 'מיישמים תיקונים מאושרים, מאמתים כתובות ועוקבים אחר נראות וביצועים לאורך זמן.' }
      ],
      faqHeading: 'שאלות נפוצות',
      faq: [
        { question: 'שיפור Core Web Vitals מבטיח עלייה בדירוגים?', answer: 'לא. הדירוג מושפע מרלוונטיות, תחרות, איכות האתר ומאותות נוספים. שיפור ביצועים חשוב למשתמשים אבל אינו מבטיח שינוי בדירוג.' },
        { question: 'כדאי להתקין עוד אפליקציית SEO?', answer: 'רק אם היא פותרת בעיה מאומתת. בעיות רבות של אינדוקס, canonical ונתונים מובנים נפתרות טוב יותר בתבנית או בארכיטקטורה.' },
        { question: 'אפשר לבדוק בלי גישת Search Console?', answer: 'כן, נתחיל מעמודים ציבוריים. אבל מידע על שאילתות, חשיפות, אינדוקס ותוצאות יהיה מדויק יותר עם גישה מאומתת.' }
      ],
      ctaHeading: 'נדע מה לתקן לפני שמוסיפים עוד כלים',
      ctaDescription: 'בקשו סקירה ממוקדת לחנות ונזהה אילו בדיקות טכניות הכי כדאי לבצע קודם.',
      ctaLabel: 'בקשת סקירה מקצועית בחינם',
      backLabel: 'לשירותי Shopify'
    }
  }
};

export function generateStaticParams() {
  return routing.locales.flatMap(locale => Object.keys(services).map(slug => ({ locale, slug })));
}

function isServiceSlug(slug: string): slug is ServiceSlug {
  return Object.prototype.hasOwnProperty.call(services, slug);
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  if (!isServiceSlug(slug)) return { robots: { index: false, follow: false } };
  const locale: Locale = requestedLocale === 'he' ? 'he' : 'en';
  const page = services[slug][locale];
  return createSeoMetadata({
    title: page.title,
    description: page.description,
    url: '/services/' + slug
  }, locale);
}

export default async function ShopifyServicePage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: requestedLocale, slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  const locale: Locale = requestedLocale === 'he' ? 'he' : 'en';
  setRequestLocale(locale);
  const page = services[slug][locale];

  return (
    <main className="min-h-screen bg-background text-surface-900 dark:bg-surface-950 dark:text-white">
      <section className="border-b border-surface-200 px-4 pb-20 pt-36 dark:border-white/10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">{page.eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">{page.title.split(' | ')[0]}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{page.introduction}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/free-store-review" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">{page.ctaLabel}</Link>
            <Link href="/solutions/shopify" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-surface-300 px-6 py-3 font-semibold dark:border-white/20">{page.backLabel}</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">{page.problemsHeading}</h2>
            <ul className="mt-6 list-disc space-y-4 ps-5 leading-relaxed text-surface-600 dark:text-surface-300">
              {page.problems.map(problem => <li key={problem}>{problem}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-surface-200 bg-surface-50 p-7 dark:border-white/10 dark:bg-surface-900">
            <h2 className="text-2xl font-bold">{page.workHeading}</h2>
            <ul className="mt-6 list-disc space-y-4 ps-5 leading-relaxed text-surface-600 dark:text-surface-300">
              {page.work.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-surface-50 px-4 py-16 dark:bg-surface-900/30 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold">{page.processHeading}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {page.process.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-white/10 dark:bg-surface-900">
                <span className="text-sm font-black text-primary-600">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-surface-600 dark:text-surface-300">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold">{page.faqHeading}</h2>
          <div className="mt-7 space-y-4">
            {page.faq.map(item => (
              <div key={item.question} className="border-b border-surface-200 pb-5 dark:border-white/10">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 leading-relaxed text-surface-600 dark:text-surface-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-50 px-4 py-20 dark:bg-surface-900/30 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">{page.ctaHeading}</h2>
          <p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">{page.ctaDescription}</p>
          <Link href="/free-store-review" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-600 px-7 py-3 font-semibold text-white hover:bg-primary-700">{page.ctaLabel}</Link>
        </div>
      </section>
    </main>
  );
}
