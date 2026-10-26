import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import {
  ArrowRight, ArrowUpRight, CalendarClock, Check, CheckCircle2,
  CreditCard, HeartHandshake, PackageCheck, Repeat2, SearchCheck,
  ShieldCheck, ShoppingBag, TrendingUp, Workflow,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  generateMetadata as createSeoMetadata,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateFAQPageSchema,
} from '@/lib/seo';

type Locale = 'he' | 'en';

const copy = {
  he: {
    seoTitle: 'הקמת מנויים לחנויות Shopify | תוכניות רכישה חוזרת | CartShift',
    seoDescription: 'מנויים, אספקה קבועה ו־Subscribe & Save בחנויות Shopify. מייעצים, בודקים התאמה לסליקה, מעצבים ומטמיעים תהליך רכישה חוזרת שמתאים לעסק שלכם.',
    eyebrow: 'SHOPIFY SUBSCRIPTIONS · RETENTION',
    headline: 'הלקוח צריך את המוצר שוב.',
    headlineAccent: 'החנות שלכם צריכה להיות שם.',
    intro: 'הופכים רכישות חד־פעמיות למערכת יחסים מתמשכת: תוכניות אספקה קבועה, תדירות שהלקוח בוחר וחוויית קנייה שמקלה עליו לחזור. אנחנו מתכננים ומקימים את הפתרון שמתאים לחנות, לסליקה ולתפעול שלכם.',
    primaryCta: 'בדיקת התאמה לחנות בחינם',
    secondaryCta: 'איך זה עובד',
    trust: ['מתחילים בבדיקת היתכנות', 'מותאם ל־Shopify', 'מתכננים גם את התפעול'],
    visualTop: 'דוגמה לחוויית רכישה חוזרת',
    visualProduct: 'המוצר שהלקוח אוהב',
    visualOneTime: 'רכישה חד־פעמית',
    visualRepeat: 'קבלה באופן קבוע',
    visualFrequency: 'כל 4 שבועות',
    visualFlex: 'בחירת תדירות · ניהול המנוי · שקיפות במחיר',
    visualNote: 'המחשה בלבד. אפשרויות החיוב בפועל כפופות לספק הסליקה.',
    painEyebrow: 'למה בכלל מנויים?',
    painTitle: 'פחות צורך לזכור להזמין. יותר סיבות לחזור.',
    painIntro: 'כשמוצר נגמר ומזמינים אותו שוב, חוויית הקנייה יכולה להיות פשוטה בהרבה. מנוי מתאים הופך את התזכורת והחזרה לחלק מהשירות — בלי להעמיס על הלקוח.',
    benefits: [
      { title: 'קנייה חוזרת נוחה', text: 'לקוחות יכולים לבחור תדירות שמתאימה לשגרת השימוש שלהם, במקום להתחיל בכל פעם מחדש.' },
      { title: 'קשר מתמשך עם הלקוח', text: 'תקשורת לאורך מחזור חיי המנוי, שליטה בשינויים וחוויית שירות עקבית.' },
      { title: 'תכנון מדויק יותר', text: 'כשהמידע זמין, אפשר ללמוד מדפוסי רכישה חוזרת ולתכנן מלאי ופעילות בהתאם.' },
    ],
    whoTitle: 'מתאים במיוחד למוצרים שחוזרים לקנות',
    who: ['מזון ומוצרים לחיות מחמד', 'קפה ומוצרי צריכה', 'טיפוח וקוסמטיקה', 'תוספים ומוצרים מתכלים'],
    modesEyebrow: 'לא כל חנות צריכה את אותו פתרון',
    modesTitle: 'בוחרים מודל מנוי שמתאים לעסק — לא להפך.',
    modesIntro: 'אנחנו בודקים קודם את הסליקה, המלאי והלוגיסטיקה, ורק אחר כך מחליטים אם נדרש חיוב אוטומטי או מסלול הזמנה חוזרת פשוט יותר.',
    autoLabel: 'מסלול 01',
    autoTitle: 'מנוי עם חיוב אוטומטי',
    autoText: 'הלקוח בוחר תדירות, מאשר חיובים עתידיים ויכול לנהל את המנוי. בכל מחזור מוצלח נוצרת הזמנה חדשה בהתאם לפתרון שנבחר.',
    autoPoints: ['חידוש תקופתי ללא רכישה מחדש', 'ניהול השהיות, דילוגים וביטולים', 'נדרש ספק סליקה נתמך ואישור מתאים'],
    reminderLabel: 'מסלול 02',
    reminderTitle: 'הזמנה חוזרת עם תזכורת',
    reminderText: 'הלקוח מצטרף למסלול אספקה חוזרת ומקבל תזכורת עם קישור לתשלום בכל מחזור. מתאים כשחיוב אוטומטי עדיין לא זמין או אינו רצוי.',
    reminderPoints: ['ממשיך להשתמש ב־Checkout הקיים', 'בלי התחייבות לסליקה חוזרת אוטומטית', 'כל חידוש מותנה בתשלום הלקוח'],
    scopeEyebrow: 'מה אנחנו עושים',
    scopeTitle: 'לא רק מתקינים אפליקציה. מחברים את כל מסע המנוי.',
    scope: [
      { title: 'אפיון המודל העסקי', text: 'מוצרים מתאימים, תדירות, הטבה אפשרית ומדדי הצלחה.' },
      { title: 'בדיקת סליקה וזכאות', text: 'בודקים את הספק הקיים, תנאי החיוב והמגבלות של Shopify.' },
      { title: 'חוויית מנוי מעוצבת', text: 'בחירה ברורה בדף המוצר, במובייל ובתהליך הרכישה.' },
      { title: 'חיבור למלאי ולהזמנות', text: 'מיפוי השפעת החידושים על ליקוט, שילוח, חיובים ואינטגרציות.' },
      { title: 'אוטומציות ותקשורת', text: 'תזכורות, התראות ותהליכי שינוי או כשל לפי הצורך.' },
      { title: 'בדיקות והעברה לתפעול', text: 'תרחישי חידוש, ביטול, כשל תשלום והדרכה לצוות.' },
    ],
    processTitle: 'שלושה שלבים, בלי פיתוח מיותר',
    process: [
      { title: 'מאבחנים את החנות', text: 'מכירים את המוצרים, הלקוחות, מערכת הסליקה ותהליך אספקת ההזמנות.' },
      { title: 'מציעים מסלול ברור', text: 'מפרידים בין מה שכבר נתמך, מה שתלוי באישור ספק חיצוני ומה שנדרש לפתח.' },
      { title: 'מקימים, בודקים ומלווים', text: 'מיישמים רק לאחר אישור ההצעה, בודקים מחזור רכישה שלם ומתעדים את ההפעלה.' },
    ],
    techTitle: 'חיבור למערכות שכבר עובדות בעסק',
    techText: 'מנוי מוצלח לא נעצר בכפתור בדף המוצר. אנחנו בוחנים גם את תשלומי החידוש, ההזמנות החוזרות, ניתוב ההזמנות, ניהול המלאי וההודעות ללקוח — כדי שהפתרון לא ייצור עבודה ידנית חדשה.',
    eligibilityTitle: 'נקודה חשובה על חיובים אוטומטיים',
    eligibilityText: 'Shopify דורשת שער סליקה נתמך למנויים עם חיוב אוטומטי. תמיכה ברכישה רגילה אינה מעידה בהכרח על תמיכה בחיוב חוזר. נבדוק זכאות ואישורים לפני שנבטיח את מסלול החיוב האוטומטי.',
    eligibilityLink: 'מגבלות המנויים בתיעוד Shopify',
    faqTitle: 'שאלות נפוצות',
    faq: [
      { question: 'האם חייבים להחליף את ספק הסליקה?', answer: 'לא בהכרח. מנוי עם חיוב אוטומטי דורש שער סליקה שתומך במנויי Shopify ואישור מתאים. אפשר גם להתחיל במודל של תזכורות והזמנות חוזרות באמצעות התשלום הרגיל של החנות.' },
      { question: 'האם אפשר להציע הנחה למנויים?', answer: 'כן, אפשר לתכנן הטבה למנוי בכפוף למנגנון הנבחר. נבדוק את הרווחיות, עלויות המשלוח והעמלות לפני שנמליץ על גובה ההנחה.' },
      { question: 'האם המנוי מתאים רק למזון לחיות?', answer: 'לא. השירות מתאים לעסקים שמוכרים מוצרים שהלקוחות צורכים וקונים מחדש בתדירות ידועה או צפויה: קפה, טיפוח, ציוד מתכלה ועוד.' },
      { question: 'מה קורה אם לקוח רוצה לדלג על משלוח או לבטל?', answer: 'במסלול אוטומטי נבחר פתרון עם יכולות ניהול מתאימות ונגדיר כללים ברורים. היכולות המדויקות תלויות באפליקציה ובספק הסליקה שנבחרו.' },
      { question: 'כמה עולה להקים תוכנית מנויים?', answer: 'המחיר תלוי בזכאות לסליקה חוזרת, בכמות המוצרים, בהתאמות העיצוב ובאינטגרציות הקיימות. מתחילים בסקירת התאמה ולאחריה מקבלים הצעת עבודה מוגדרת.' },
    ],
    ctaEyebrow: 'מתחילים מהחנות שלכם',
    ctaTitle: 'בואו נבדוק אם מנויים באמת מתאימים לעסק שלכם.',
    ctaText: 'שתפו את כתובת החנות ומה הייתם רוצים למכור שוב ושוב. נתחיל בסקירה מקצועית ונחזור עם כיוון מעשי — בלי התחייבות לפיתוח.',
    ctaFooter: 'הסקירה הראשונית אינה כוללת הקמה או התחייבות לתוצאות מסחריות.',
    backLabel: 'לכל שירותי Shopify',
    navigationLabel: 'מנויים ואספקה חוזרת',
  },
  en: {
    seoTitle: 'Shopify Subscriptions & Recurring Orders Setup | CartShift',
    seoDescription: 'Subscription plans, repeat delivery, and Subscribe & Save for Shopify stores. Strategy, payment eligibility, customer experience, integration and implementation.',
    eyebrow: 'SHOPIFY SUBSCRIPTIONS · RETENTION',
    headline: 'Your customers need it again.',
    headlineAccent: 'Make coming back effortless.',
    intro: 'Turn one-off purchases into a lasting relationship with flexible delivery schedules and a buying experience designed for repeat customers. We design the approach around your storefront, payments and operations.',
    primaryCta: 'Get a free subscription-fit review',
    secondaryCta: 'How it works',
    trust: ['Feasibility first', 'Built for Shopify', 'Operations included'],
    visualTop: 'A sample repeat-purchase experience',
    visualProduct: 'A product customers love',
    visualOneTime: 'One-time purchase',
    visualRepeat: 'Repeat delivery',
    visualFrequency: 'Every 4 weeks',
    visualFlex: 'Flexible schedule · Customer control · Clear pricing',
    visualNote: 'Illustrative only. Actual billing depends on payment provider eligibility.',
    painEyebrow: 'Why subscriptions?',
    painTitle: 'Fewer reorders to remember. More reasons to return.',
    painIntro: 'For products customers need regularly, buying again should feel easy. A well-designed subscription removes repeated effort without sacrificing customer choice.',
    benefits: [
      { title: 'Easy repeat purchasing', text: 'Customers choose a schedule that fits their usage, instead of starting from scratch each time.' },
      { title: 'Long-term relationships', text: 'Clear communication throughout the subscription lifecycle and control over changes.' },
      { title: 'More informed planning', text: 'When data is available, repeat-purchase patterns can inform stock and campaign planning.' },
    ],
    whoTitle: 'A strong fit for frequently replenished products',
    who: ['Pet food and supplies', 'Coffee and consumables', 'Beauty and personal care', 'Supplements and essentials'],
    modesEyebrow: 'One model does not fit every store',
    modesTitle: 'Choose the subscription model that fits your business.',
    modesIntro: 'We check payments, inventory and fulfillment first, then decide whether automatic billing or a simpler recurring-order workflow is the right choice.',
    autoLabel: 'OPTION 01',
    autoTitle: 'Automatically billed subscriptions',
    autoText: 'Customers select a schedule and authorize future charges. Successful billing cycles create new orders through a compatible subscription solution.',
    autoPoints: ['Automated renewal without a new checkout', 'Skip, pause and cancel controls where supported', 'Requires an eligible payment gateway and approval'],
    reminderLabel: 'OPTION 02',
    reminderTitle: 'Repeat orders with payment reminders',
    reminderText: 'Customers join a repeat-delivery plan and receive a payment link for each cycle. Useful when automatic billing is unavailable or unnecessary.',
    reminderPoints: ['Uses the existing checkout', 'No automatic recurring payment commitment', 'Each renewal requires customer payment'],
    scopeEyebrow: 'What we deliver',
    scopeTitle: 'More than installing an app. We connect the full subscription journey.',
    scope: [
      { title: 'Offer and business model', text: 'Products, schedule, incentives and success metrics.' },
      { title: 'Payments and eligibility', text: 'Review existing provider, recurring billing requirements and platform constraints.' },
      { title: 'Customer experience', text: 'Clear choices on product pages, mobile and checkout.' },
      { title: 'Inventory and order flow', text: 'Map renewal orders to fulfillment, shipping and integrations.' },
      { title: 'Automations and messaging', text: 'Reminders, notifications, changes and failed-payment handling as needed.' },
      { title: 'QA and handover', text: 'Renewal, cancellation and failure testing with team training.' },
    ],
    processTitle: 'Three focused steps, no unnecessary development',
    process: [
      { title: 'Understand your store', text: 'Review your products, customer journey, payment setup and shipping process.' },
      { title: 'Recommend the right model', text: 'Separate what is supported today, what needs provider approval and what needs custom development.' },
      { title: 'Build, test and hand over', text: 'Implement an approved scope, validate an end-to-end cycle and document operations.' },
    ],
    techTitle: 'Works with your existing operations',
    techText: 'A subscription is more than a product-page button. We account for recurring payments, orders, routing, stock updates and customer notifications so the solution does not create manual work elsewhere.',
    eligibilityTitle: 'Important: automatic billing eligibility',
    eligibilityText: 'Shopify requires a supported payment gateway for auto-billed subscriptions. A provider that supports one-time payments does not necessarily support Shopify subscription billing. We verify eligibility before promising automatic charges.',
    eligibilityLink: 'Shopify subscription requirements',
    faqTitle: 'Frequently asked questions',
    faq: [
      { question: 'Do I need to replace my payment provider?', answer: 'Not necessarily. Auto-billed Shopify subscriptions require an eligible gateway and approval. A reminder-based repeat-order plan can often continue using your existing checkout.' },
      { question: 'Can we offer subscriber discounts?', answer: 'Yes, subject to the chosen solution. We review margin, shipping costs and fees before recommending an incentive.' },
      { question: 'Are subscriptions just for pet food?', answer: 'No. They suit frequently replenished goods such as coffee, personal care, consumables and other repeat purchases.' },
      { question: 'What if customers need to skip or cancel?', answer: 'For automatic plans, we choose a solution with appropriate customer controls and clear policies. Exact capabilities depend on the app and gateway.' },
      { question: 'How much does setup cost?', answer: 'It depends on payment eligibility, product catalog, UI customization and integrations. We start with a store-fit review, then provide a scoped proposal.' },
    ],
    ctaEyebrow: 'Start with your store',
    ctaTitle: 'Let us see whether subscriptions make sense for your business.',
    ctaText: 'Share your store URL and the products customers reorder. We will begin with an expert review and recommend a practical direction before any implementation commitment.',
    ctaFooter: 'The initial review does not include implementation or guarantee commercial results.',
    backLabel: 'Explore Shopify services',
    navigationLabel: 'Subscriptions & repeat orders',
  },
} as const;

const reviewHref = {
  pathname: '/free-store-review',
  query: { service: 'shopify-subscriptions' },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const page = copy[locale === 'he' ? 'he' : 'en'];
  return createSeoMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    url: '/services/shopify-subscriptions',
    keywords: locale === 'he'
      ? ['מנויים בשופיפיי', 'הקמת מנויים Shopify', 'מנוי חודשי שופיפיי', 'רכישה חוזרת', 'אספקה קבועה', 'Subscribe and Save']
      : ['Shopify subscription setup', 'Shopify recurring orders', 'Subscribe and Save Shopify', 'Shopify subscription service'],
  }, locale === 'he' ? 'he' : 'en');
}

export default async function ShopifySubscriptionsServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale: Locale = requestedLocale === 'he' ? 'he' : 'en';
  setRequestLocale(locale);
  const p = copy[locale];
  const url = '/services/shopify-subscriptions';

  const schemas = [
    generateServiceSchema(p.navigationLabel, p.seoDescription, { locale, url }),
    generateBreadcrumbSchema([
      { name: locale === 'he' ? 'ראשי' : 'Home', url: '/' },
      { name: 'Shopify', url: '/solutions/shopify' },
      { name: p.navigationLabel, url },
    ], locale),
    generateFAQPageSchema(p.faq),
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-surface-900 dark:bg-surface-950 dark:text-white">
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <section className="relative isolate border-b border-surface-200 px-4 pb-20 pt-32 dark:border-white/10 sm:px-6 lg:pb-28 lg:pt-40">
        <div className="pointer-events-none absolute -top-12 end-[-10%] -z-10 h-[30rem] w-[30rem] rounded-full bg-primary-500/10 blur-[100px]" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold tracking-wide text-primary-700 dark:text-primary-300">
              <Repeat2 className="h-4 w-4" aria-hidden="true" /> {p.eyebrow}
            </p>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.14] tracking-tight sm:text-5xl lg:text-6xl">
              {p.headline}
              <span className="mt-2 block text-primary-600 dark:text-primary-400">{p.headlineAccent}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{p.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={reviewHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                {p.primaryCta}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-surface-300 px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface-100 dark:border-white/20 dark:hover:bg-white/5">{p.secondaryCta}</a>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {p.trust.map(note => (
                <li key={note} className="flex items-center gap-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
                  <CheckCircle2 className="size-4 text-primary-600 dark:text-primary-400" aria-hidden="true" /> {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] border border-primary-500/10" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-surface-200 bg-white p-6 shadow-xl shadow-surface-950/5 dark:border-white/10 dark:bg-surface-900 dark:shadow-black/10 sm:p-8">
              <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                <ShoppingBag className="size-4" aria-hidden="true" /> {p.visualTop}
              </p>
              <div className="flex items-center gap-4 border-b border-surface-200 pb-6 dark:border-white/10">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-primary-500/15 bg-primary-500/10">
                  <PackageCheck className="size-10 text-primary-600 dark:text-primary-400" strokeWidth={1.4} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 h-2 w-16 rounded-full bg-primary-500/20" aria-hidden="true" />
                  <p className="text-lg font-bold">{p.visualProduct}</p>
                  <div className="mt-2 h-2 w-28 max-w-full rounded-full bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 text-sm text-surface-600 dark:border-white/10 dark:text-surface-300">
                  <span className="size-4 rounded-full border-2 border-surface-400" aria-hidden="true" />{p.visualOneTime}
                </div>
                <div className="rounded-xl border-2 border-primary-500 bg-primary-500/5 p-4">
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary-600 text-white"><Check className="size-3" aria-hidden="true" /></span>{p.visualRepeat}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary-500/20 bg-white px-4 py-3 text-sm font-semibold dark:bg-surface-950">
                    <CalendarClock className="size-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    {p.visualFrequency}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-surface-600 dark:text-surface-300">{p.visualFlex}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-surface-500">{p.visualNote}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">{p.painEyebrow}</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{p.painTitle}</h2>
            <p className="max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{p.painIntro}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {p.benefits.map((item, index) => {
              const Icon = [Repeat2, HeartHandshake, TrendingUp][index];
              return <article key={item.title} className="rounded-2xl border border-surface-200 bg-surface-50 p-6 dark:border-white/10 dark:bg-surface-900/60">
                <Icon className="mb-6 size-7 text-primary-600 dark:text-primary-400" strokeWidth={1.6} aria-hidden="true" />
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{item.text}</p>
              </article>;
            })}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <p className="me-3 text-sm font-semibold text-surface-600 dark:text-surface-300">{p.whoTitle}</p>
            {p.who.map(item => <span key={item} className="rounded-full border border-surface-200 px-4 py-2 text-xs font-medium dark:border-white/10">{item}</span>)}
          </div>
        </div>
      </section>

      <section className="border-y border-surface-200 bg-surface-50 px-4 py-20 dark:border-white/10 dark:bg-surface-900/30 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">{p.modesEyebrow}</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{p.modesTitle}</h2>
          <p className="mt-5 max-w-3xl leading-relaxed text-surface-600 dark:text-surface-300">{p.modesIntro}</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {([
              { label: p.autoLabel, title: p.autoTitle, text: p.autoText, points: p.autoPoints, icon: CreditCard },
              { label: p.reminderLabel, title: p.reminderTitle, text: p.reminderText, points: p.reminderPoints, icon: CalendarClock },
            ]).map((mode, index) => {
              const Icon = mode.icon;
              return <article key={mode.title} className={"rounded-3xl border p-7 sm:p-9 " + (index === 0 ? 'border-primary-500/40 bg-white dark:bg-surface-900' : 'border-surface-200 bg-white dark:border-white/10 dark:bg-surface-900')}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold tracking-wider text-primary-600 dark:text-primary-400">{mode.label}</span>
                  <Icon className="size-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-2xl font-bold">{mode.title}</h3>
                <p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">{mode.text}</p>
                <ul className="mt-8 space-y-3 border-t border-surface-200 pt-6 dark:border-white/10">
                  {mode.points.map(point => <li key={point} className="flex items-start gap-3 text-sm font-medium">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />{point}
                  </li>)}
                </ul>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">{p.scopeEyebrow}</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{p.scopeTitle}</h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {p.scope.map((item, index) => {
              const Icon = [SearchCheck, CreditCard, ShoppingBag, Workflow, Repeat2, ShieldCheck][index];
              return <article key={item.title} className="border-t border-surface-200 pt-5 dark:border-white/10">
                <Icon className="size-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{item.text}</p>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-surface-200 bg-surface-50 px-4 py-20 dark:border-white/10 dark:bg-surface-900/30 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold sm:text-4xl">{p.processTitle}</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {p.process.map((step, index) => <li key={step.title} className="border-t-2 border-primary-500/50 pt-6">
              <span className="text-xs font-black text-primary-600 dark:text-primary-400">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{step.text}</p>
            </li>)}
          </ol>
          <div className="mt-14 grid gap-6 rounded-3xl border border-surface-200 bg-white p-6 dark:border-white/10 dark:bg-surface-900 sm:p-9 lg:grid-cols-[0.36fr_1fr] lg:items-center">
            <Workflow className="size-12 text-primary-600 dark:text-primary-400" strokeWidth={1.4} aria-hidden="true" />
            <div>
              <h3 className="text-xl font-bold">{p.techTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{p.techText}</p>
            </div>
          </div>
          <aside className="mt-5 flex items-start gap-4 rounded-2xl border border-primary-500/20 bg-primary-500/5 p-5">
            <ShieldCheck className="mt-1 size-6 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <div>
              <h3 className="font-bold">{p.eligibilityTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{p.eligibilityText}</p>
              <a href="https://help.shopify.com/en/manual/products/purchase-options/subscriptions/considerations" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 underline-offset-4 hover:underline dark:text-primary-300">
                {p.eligibilityLink}<ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold sm:text-4xl">{p.faqTitle}</h2>
          <div className="mt-8 divide-y divide-surface-200 rounded-2xl border border-surface-200 dark:divide-white/10 dark:border-white/10">
            {p.faq.map(item => <details key={item.question} className="group p-5 sm:p-6">
              <summary className="cursor-pointer list-none font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">{item.question}<span className="text-primary-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span></span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{item.answer}</p>
            </details>)}
          </div>
        </div>
      </section>

      <section className="border-t border-surface-200 bg-surface-50 px-4 py-20 dark:border-white/10 dark:bg-surface-900/30 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">{p.ctaEyebrow}</p>
          <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">{p.ctaTitle}</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-surface-600 dark:text-surface-300">{p.ctaText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={reviewHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 py-3 font-bold text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
              {p.primaryCta}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link href="/solutions/shopify" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-surface-300 px-6 py-3 font-semibold hover:bg-surface-100 dark:border-white/20 dark:hover:bg-white/5">{p.backLabel}</Link>
          </div>
          <p className="mt-5 text-xs text-surface-500">{p.ctaFooter}</p>
        </div>
      </section>
    </main>
  );
}
