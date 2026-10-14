import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { CheckCircle2, SearchCheck, Smartphone, ShoppingBag, ShieldCheck, Gauge, ShoppingCart, ArrowRight } from 'lucide-react';
import { StoreReviewRequestForm } from '@/components/forms/StoreReviewRequestForm';
import { isAnalyzerIntent } from '@/lib/analyzer/funnel';
import { Link } from '@/i18n/navigation';
import { generateMetadata as genMeta } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';
  return genMeta({
    title: isHe ? 'סקירת חנות אונליין מקצועית בחינם | CartShift' : 'Free Expert Ecommerce Store Review | CartShift Studio',
    description: isHe
      ? 'סקירה אישית של החנות שלכם בידי מומחי CartShift, ממצאים מבוססים והמלצות מעשיות לשיפור UX, Shopify, SEO והמרות.'
      : 'Request a personal store review from CartShift specialists. Get evidence-backed priorities for Shopify, UX, SEO and buying friction without a generic instant score.',
    url: '/free-store-review',
    keywords: isHe ? ['סקירת חנות בחינם','בדיקת חנות שופיפיי','שיפור חנות אונליין'] : ['expert store review','free shopify audit','ecommerce store review'],
  }, locale as 'en'|'he');
}

const areas = [
  { key: 'ux', icon: Smartphone }, { key: 'product', icon: ShoppingBag }, { key: 'checkout', icon: ShoppingCart },
  { key: 'seo', icon: SearchCheck }, { key: 'trust', icon: ShieldCheck }, { key: 'performance', icon: Gauge },
] as const;

export default async function FreeStoreReviewPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const { locale } = await params;
  const { focus } = await searchParams;
  setRequestLocale(locale as 'en' | 'he');
  const he = locale === 'he';
  const copy = he ? {
    badge: 'סקירה אישית לחנות', title: 'החנות שלכם יכולה לעבוד טוב יותר.', highlight: 'בואו נגלה איך.',
    subtitle: 'מומחה מצוות CartShift יבחן את החנות שלכם, יזהה הזדמנויות אמיתיות לשיפור ויעזור לכם להבין מה כדאי לעשות קודם. בלי ציון אוטומטי גנרי ובלי התחייבות.',
    formTitle: 'בקשת סקירה מקצועית בחינם', formDescription: 'מספרים לנו על החנות. אין צורך בחשבון או בגישה ל־Shopify.',
    what: 'מה נבדוק בחנות?', whatDesc: 'סקירה ממוקדת של האזורים שמשפיעים על חוויית הקנייה והאמון באתר.',
    areas: ['מובייל וחוויית משתמש','דפי מוצר והצגת מוצרים','עגלה ותשלום','SEO ונראות בחיפוש','אמון וביטחון בקנייה','ביצועים ומהירות'],
    deliver: 'סקירה שאפשר באמת לעבוד איתה', deliverDesc: 'נתמקד בהזדמנויות החשובות ביותר, במקום להציף אתכם בציונים אוטומטיים.',
    deliverables: ['3–5 ממצאים לפי סדר עדיפות','דוגמאות אמיתיות מהחנות','המלצות מעשיות להמשך','אפשרות להצעת עבודה מסודרת'],
    how: 'איך זה עובד?', steps: [
      ['משאירים פרטים', 'מוסיפים כתובת חנות ואת האתגר המרכזי.'],
      ['אנחנו בודקים בעצמנו', 'מומחה של CartShift בוחן את החנות ואת חוויית הקנייה הציבורית.'],
      ['מקבלים כיוון ברור', 'נחזור אליכם עם ממצאים והצעדים הבאים.'],
    ],
    fine: 'הסקירה הראשונית בחינם וממוקדת. היא אינה בדיקת אבטחה, ייעוץ משפטי, אישור עמידה בתקני נגישות או בדיקה של כל עמוד באתר.',
    faq: 'שאלות נפוצות', questions: [
      ['הסקירה באמת בחינם?', 'כן, הסקירה הראשונית והמסקנות המרכזיות ללא עלות וללא התחייבות לעבוד איתנו.'],
      ['צריך לתת לכם גישה לחנות?', 'לא. מתחילים מעמודים ציבוריים בלבד. אם נצטרך גישה נוספת נבקש אישור מראש.'],
      ['מתי תחזרו אליי?', 'נחזור במייל אחרי שנבחן את הבקשה, בהתאם לזמינות הצוות.'],
      ['אתם עובדים רק עם Shopify?', 'Shopify היא ההתמחות המרכזית שלנו, אבל נוכל לסקור גם פלטפורמות אחרות בהתאם לצורך.'],
    ],
  } : {
    badge: 'PERSONAL STORE REVIEW', title: 'Your store could work harder.', highlight: "Let's find out how.",
    subtitle: 'A real CartShift specialist reviews your store and identifies useful opportunities. No generic instant score and no obligation.',
    formTitle: 'Request your free expert review', formDescription: 'Tell us about your store. No account or Shopify access required.',
    what: "What we'll look at", whatDesc: 'A focused review of the areas that shape the buying experience.',
    areas: ['Mobile & user experience','Product pages & merchandising','Cart & checkout','SEO & discoverability','Customer trust','Performance signals'],
    deliver: 'A review you can actually use', deliverDesc: 'We focus on the clearest opportunities instead of burying you in automated scores.',
    deliverables: ['3–5 prioritized findings','Concrete examples from your store','Practical next steps','Optional implementation proposal'],
    how: 'How it works', steps: [
      ['Tell us about your store','Share your URL and your biggest challenge.'],
      ['We review it personally','A CartShift specialist checks the public customer journey.'],
      ['Get practical next steps','We follow up with prioritized findings and an option to work together.'],
    ],
    fine: 'The free initial review is focused. It is not a security audit, legal assessment, accessibility certification or an exhaustive full-site inspection.',
    faq: 'Frequently asked questions', questions: [
      ['Is the review really free?','Yes. The initial expert review is free, with no obligation to hire us.'],
      ['Do you need Shopify access?','No. We start with publicly accessible pages and ask permission before any deeper inspection.'],
      ['When will you get back to me?','We follow up by email after considering your request, subject to review capacity.'],
      ['Do you only work with Shopify?','Shopify is our specialty, though we also work with other suitable e-commerce platforms.'],
    ],
  };
  return <main className="bg-background text-surface-900 dark:bg-surface-950 dark:text-white">
    <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-40">
      <div className="pointer-events-none absolute -top-16 start-[-8%] h-[440px] w-[440px] rounded-full bg-primary-500/10 blur-[110px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr,0.92fr] lg:items-center lg:gap-20">
        <div>
          <span className="mb-6 inline-flex rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold tracking-wide text-primary-700 dark:text-primary-300">{copy.badge}</span>
          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{copy.title}
            <span className="mt-2 block text-primary-600 dark:text-primary-400">{copy.highlight}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{copy.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-surface-600 dark:text-surface-300">
            {(he ? ['בדיקה אנושית','בלי התחייבות','ללא עלות'] : ['Human-led','No obligation','Free']).map(text =>
              <span key={text} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-600"/>{text}</span>)}
          </div>
        </div>
        <div id="request-review" className="rounded-3xl border border-surface-200 bg-white p-5 shadow-2xl shadow-primary-900/10 dark:border-white/10 dark:bg-surface-900 sm:p-8">
          <h2 className="text-2xl font-bold">{copy.formTitle}</h2>
          <p className="mb-6 mt-2 text-sm leading-relaxed text-surface-500">{copy.formDescription}</p>
          <StoreReviewRequestForm initialFocus={isAnalyzerIntent(focus) ? focus : undefined} />
        </div>
      </div>
    </section>
    <section className="border-y border-surface-200 bg-surface-50 px-4 py-20 dark:border-white/10 dark:bg-surface-900/30 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">{copy.what}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-surface-600 dark:text-surface-300">{copy.whatDesc}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area,i) => <div key={area.key} className="flex items-center gap-4 rounded-2xl border border-surface-200 bg-white p-5 dark:border-white/10 dark:bg-surface-900">
            <area.icon className="h-6 w-6 shrink-0 text-primary-600" aria-hidden="true"/>
            <h3 className="font-semibold">{copy.areas[i]}</h3>
          </div>)}
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div><h2 className="text-3xl font-bold">{copy.deliver}</h2><p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">{copy.deliverDesc}</p>
        <Link href="/work" className="mt-6 inline-flex items-center gap-2 font-semibold text-primary-600 hover:underline">{he ? 'לפרויקטים שלנו' : 'Explore our work'} <ArrowRight size={16} className="rtl:rotate-180"/></Link>
      </div>
      <div className="grid gap-3">
        {copy.deliverables.map((value,i) => <div key={value} className="flex items-center gap-4 rounded-xl border border-surface-200 p-4 dark:border-white/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 font-bold text-primary-600">{i+1}</span><span className="font-semibold">{value}</span>
        </div>)}
      </div>
    </section>
    <section className="bg-surface-50 px-4 py-20 dark:bg-surface-900/20 sm:px-6">
      <div className="mx-auto max-w-6xl"><h2 className="mb-10 text-center text-3xl font-bold">{copy.how}</h2>
        <div className="grid gap-6 md:grid-cols-3">{copy.steps.map(([title,desc],i) => <div key={title} className="rounded-2xl bg-white p-6 dark:bg-surface-900">
          <span className="text-3xl font-black text-primary-600">0{i+1}</span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{desc}</p>
        </div>)}</div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-surface-500">{copy.fine}</p>
      </div>
    </section>
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="mb-8 text-center text-3xl font-bold">{copy.faq}</h2>
      <div className="space-y-3">{copy.questions.map(([question,answer])=><details key={question} className="group rounded-xl border border-surface-200 p-5 dark:border-white/10">
        <summary className="cursor-pointer font-semibold marker:text-primary-600">{question}</summary>
        <p className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{answer}</p>
      </details>)}</div>
    </section>
  </main>;
}
