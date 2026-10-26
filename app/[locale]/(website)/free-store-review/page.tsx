import { getTranslations, setRequestLocale } from 'next-intl/server';
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
  searchParams: Promise<{ focus?: string; service?: string }>;
}) {
  const { locale } = await params;
  const { focus, service } = await searchParams;
  const subscriptionInterest = service === 'shopify-subscriptions';
  setRequestLocale(locale as 'en' | 'he');
  // All display copy, including the form and FAQ, shares the same translation source.
  const t = await getTranslations({ locale: locale as 'en' | 'he', namespace: 'storeReview' });
  const steps = (['request', 'review', 'next'] as const).map(key => ({
    title: t(`steps.${key}.title`),
    description: t(`steps.${key}.description`),
  }));
  const faq = (['one', 'two', 'three', 'four'] as const).map(key => ({
    question: t(`faq.${key}.q`),
    answer: t(`faq.${key}.a`),
  }));
  const deliverables = (['findings', 'evidence', 'roadmap', 'proposal'] as const).map(
    key => t(`deliverables.${key}`)
  );
  return <main className="bg-background text-surface-900 dark:bg-surface-950 dark:text-white">
    <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-40">
      <div className="pointer-events-none absolute -top-16 start-[-8%] h-[440px] w-[440px] rounded-full bg-primary-500/10 blur-[110px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr,0.92fr] lg:items-center lg:gap-20">
        <div>
          <span className="mb-6 inline-flex rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold tracking-wide text-primary-700 dark:text-primary-300">{t('badge')}</span>
          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t('title')}
            <span className="mt-2 block text-primary-600 dark:text-primary-400">{t('titleHighlight')}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{t('subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-surface-600 dark:text-surface-300">
            {(t.raw('trustBadges') as string[]).map(text =>
              <span key={text} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-600"/>{text}</span>)}
          </div>
        </div>
        <div id="request-review" className="rounded-3xl border border-surface-200 bg-white p-5 shadow-2xl shadow-primary-900/10 dark:border-white/10 dark:bg-surface-900 sm:p-8">
          <h2 className="text-2xl font-bold">{t('formTitle')}</h2>
          <p className="mb-6 mt-2 text-sm leading-relaxed text-surface-500">{t('formDescription')}</p>
          <StoreReviewRequestForm
            initialFocus={isAnalyzerIntent(focus) ? focus : undefined}
            initialNotes={subscriptionInterest
              ? (locale === 'he'
                ? 'אני מעוניין/ת לבדוק הקמת מנויים ואספקה חוזרת בחנות Shopify שלי.'
                : 'I would like to explore Shopify subscriptions and repeat-delivery options for my store.')
              : undefined}
          />
        </div>
      </div>
    </section>
    <section className="border-y border-surface-200 bg-surface-50 px-4 py-20 dark:border-white/10 dark:bg-surface-900/30 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">{t('whatTitle')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-surface-600 dark:text-surface-300">{t('whatDescription')}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map(area => <div key={area.key} className="flex items-center gap-4 rounded-2xl border border-surface-200 bg-white p-5 dark:border-white/10 dark:bg-surface-900">
            <area.icon className="h-6 w-6 shrink-0 text-primary-600" aria-hidden="true"/>
            <h3 className="font-semibold">{t(`areas.${area.key}`)}</h3>
          </div>)}
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div><h2 className="text-3xl font-bold">{t('deliverTitle')}</h2><p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">{t('deliverDescription')}</p>
        <Link href="/work" className="mt-6 inline-flex items-center gap-2 font-semibold text-primary-600 hover:underline">{t('workLink')} <ArrowRight size={16} className="rtl:rotate-180"/></Link>
      </div>
      <div className="grid gap-3">
        {deliverables.map((value,i) => <div key={value} className="flex items-center gap-4 rounded-xl border border-surface-200 p-4 dark:border-white/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 font-bold text-primary-600">{i+1}</span><span className="font-semibold">{value}</span>
        </div>)}
      </div>
    </section>
    <section className="bg-surface-50 px-4 py-20 dark:bg-surface-900/20 sm:px-6">
      <div className="mx-auto max-w-6xl"><h2 className="mb-10 text-center text-3xl font-bold">{t('howTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">{steps.map(({ title, description },i) => <div key={title} className="rounded-2xl bg-white p-6 dark:bg-surface-900">
          <span className="text-3xl font-black text-primary-600">0{i+1}</span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{description}</p>
        </div>)}</div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-surface-500">{t('finePrint')}</p>
      </div>
    </section>
    <section className="border-t border-surface-200 px-4 py-20 dark:border-white/10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold">{t('scopeComparison.title')}</h2>
        <p className="mt-4 max-w-3xl text-surface-600 dark:text-surface-300">{t('scopeComparison.intro')}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {(['free', 'storeAudit', 'seoAudit'] as const).map(key => (
            <div key={key} className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-white/10 dark:bg-surface-900">
              <h3 className="text-xl font-bold">{t(`scopeComparison.${key}.title`)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{t(`scopeComparison.${key}.description`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-surface-500">{t('scopeComparison.note')}</p>
        <Link href="/solutions/seo" className="mt-4 inline-flex items-center gap-2 font-semibold text-primary-700 hover:underline dark:text-primary-300">{t('scopeComparison.seoLink')} <ArrowRight className="size-4 rtl:rotate-180" /></Link>
      </div>
    </section>
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="mb-8 text-center text-3xl font-bold">{t('faqTitle')}</h2>
      <div className="space-y-3">{faq.map(({ question, answer })=><details key={question} className="group rounded-xl border border-surface-200 p-5 dark:border-white/10">
        <summary className="cursor-pointer font-semibold marker:text-primary-600">{question}</summary>
        <p className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{answer}</p>
      </details>)}</div>
    </section>
  </main>;
}
