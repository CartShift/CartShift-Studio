import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Layers3,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { WordPressSecurityLeadForm } from '@/components/forms/WordPressSecurityLeadForm';
import {
  generateMetadata as genMeta,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateFAQPageSchema,
} from '@/lib/seo';

type Locale = 'en' | 'he';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'wordpressSecurity' });
  return genMeta(
    {
      title: t('seoTitle'),
      description: t('seoDescription'),
      url: '/services/wordpress-security',
      keywords: locale === 'he'
        ? ['בדיקת אבטחה וורדפרס', 'אבטחת אתר וורדפרס', 'עדכון PHP', 'תחזוקת וורדפרס', 'PHP2Shell']
        : ['WordPress security check', 'WordPress security maintenance', 'PHP patch verification', 'PHP2Shell', 'WordPress plugin updates'],
    },
    locale as Locale
  );
}

const featureIcons = [ServerCog, Layers3, LockKeyhole, Wrench, ClipboardCheck, FileCheck2] as const;

export default async function WordPressSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale as Locale;
  setRequestLocale(activeLocale);
  const t = await getTranslations({ locale: activeLocale, namespace: 'wordpressSecurity' });
  const features = t.raw('features') as { title: string; description: string }[];
  const process = t.raw('process') as { title: string; description: string }[];
  const faq = t.raw('faq') as { question: string; answer: string }[];
  const trustNotes = t.raw('trustNotes') as string[];

  const serviceSchema = generateServiceSchema(
    activeLocale === 'he' ? 'בדיקת אבטחה ותחזוקת WordPress' : 'WordPress Security & Maintenance Review',
    t('seoDescription'),
    { url: '/services/wordpress-security', locale: activeLocale }
  );
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: activeLocale === 'he' ? 'בית' : 'Home', url: '/' },
      { name: activeLocale === 'he' ? 'שירותי WordPress' : 'WordPress', url: '/solutions/wordpress' },
      { name: activeLocale === 'he' ? 'בדיקת אבטחה' : 'Security Check', url: '/services/wordpress-security' },
    ],
    activeLocale
  );

  return (
    <main className="bg-background text-surface-900 dark:bg-surface-950 dark:text-white">
      <Script id="wordpress-security-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="wordpress-security-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="wordpress-security-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageSchema(faq)) }} />

      <section className="relative isolate overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_10%,rgba(33,117,155,0.13),transparent_50%)]" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-700 dark:text-primary-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t('eyebrow')}
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.13] tracking-tight sm:text-5xl lg:text-6xl">
              {t('title')}
              <span className="mt-3 block text-primary-600 dark:text-primary-400">{t('titleAccent')}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{t('subtitle')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#security-request" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-900/10 transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                {t('primaryCta')} <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#what-we-check" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-surface-300 px-6 py-3 font-semibold text-surface-900 transition-colors hover:bg-surface-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                {t('secondaryCta')}
              </a>
            </div>
            <ul className="mt-9 space-y-3 text-sm text-surface-600 dark:text-surface-300">
              {trustNotes.map(note => (
                <li key={note} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />{note}</li>
              ))}
            </ul>
          </div>
          <div id="security-request" className="scroll-mt-28">
            <WordPressSecurityLeadForm />
          </div>
        </div>
      </section>

      <section className="border-y border-surface-200 bg-surface-50 px-4 py-9 dark:border-white/10 dark:bg-surface-900/60 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="max-w-4xl">
            <h2 className="text-lg font-bold">{t('alertTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{t('alertText')}</p>
            <a href="https://digital.nhs.uk/cyber-alerts/2026/cc-4875" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 underline-offset-4 hover:underline dark:text-primary-300">
              {t('alertLink')} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.55fr_1fr] lg:items-start lg:gap-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50 text-primary-600 dark:border-white/10 dark:bg-surface-900 dark:text-primary-400">
            <ServerCog className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t('whyTitle')}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{t('whyText')}</p>
          </div>
        </div>
      </section>

      <section id="what-we-check" className="scroll-mt-24 border-y border-surface-200 bg-surface-50 px-4 py-20 dark:border-white/10 dark:bg-surface-900/30 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{t('serviceTitle')}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-surface-600 dark:text-surface-300">{t('serviceIntro')}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = featureIcons[index] ?? ShieldCheck;
              return (
                <article key={feature.title} className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-white/10 dark:bg-surface-900">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-700 dark:text-primary-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-lg font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('processTitle')}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {process.map((step, index) => (
              <li key={step.title} className="border-t-2 border-primary-500/50 pt-5">
                <span className="text-sm font-bold tabular-nums text-primary-700 dark:text-primary-300">{String(index + 1).padStart(2,'0')}</span>
                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 max-w-md leading-relaxed text-surface-600 dark:text-surface-300">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border border-surface-200 bg-surface-50 p-7 dark:border-white/10 dark:bg-surface-900 sm:p-10">
          <h2 className="text-2xl font-bold">{t('scopeTitle')}</h2>
          <p className="max-w-4xl leading-relaxed text-surface-600 dark:text-surface-300">{t('scopeText')}</p>
        </div>
      </section>

      <section className="border-t border-surface-200 px-4 py-20 dark:border-white/10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('faqTitle')}</h2>
          <div className="mt-8 divide-y divide-surface-200 rounded-2xl border border-surface-200 dark:divide-white/10 dark:border-white/10">
            {faq.map(({question,answer}) => (
              <details key={question} className="group p-5 sm:p-6">
                <summary className="cursor-pointer list-none text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-5">{question}<span className="text-primary-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span></span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-surface-600 dark:text-surface-300">{answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="#security-request" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 py-3 font-bold text-white hover:bg-primary-700">
              {t('primaryCta')} <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
