import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  DatabaseBackup,
  Fingerprint,
  Layers3,
  Plus,
  ServerCog,
  ShieldCheck,
  X,
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

  return genMeta({
    title: t('seoTitle'),
    description: t('seoDescription'),
    url: '/services/wordpress-security',
    socialImage: '/og/wordpress-security-launch.png',
    keywords: locale === 'he'
      ? ['חבילת אבטחת WordPress', 'בדיקת אבטחה וורדפרס', 'תחזוקת וורדפרס', 'תיקוני אבטחה PHP', 'PHP2Shell']
      : ['WordPress security package', 'WordPress security check', 'WordPress maintenance', 'PHP security patches', 'PHP2Shell'],
  }, locale as Locale);
}

const featureIcons = [ServerCog, Layers3, DatabaseBackup, Fingerprint, ShieldCheck, ClipboardCheck] as const;

export default async function WordPressSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale as Locale;
  setRequestLocale(activeLocale);

  const t = await getTranslations({ locale: activeLocale, namespace: 'wordpressSecurity' });
  const features = t.raw('features') as Array<{ title: string; description: string }>;
  const process = t.raw('process') as Array<{ title: string; description: string }>;
  const faq = t.raw('faq') as Array<{ question: string; answer: string }>;
  const trustNotes = t.raw('trustNotes') as string[];
  const included = t.raw('offer.included') as string[];
  const excluded = t.raw('offer.excluded') as string[];

  const serviceSchema = generateServiceSchema(
    activeLocale === 'he' ? 'חבילת אבטחה ותחזוקה לאתרי WordPress' : 'WordPress Security & Maintenance Package',
    t('seoDescription'),
    { url: '/services/wordpress-security', locale: activeLocale, priceRange: 'ILS 890', image: 'https://cart-shift.com/og/wordpress-security-launch.png' }
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: activeLocale === 'he' ? 'בית' : 'Home', url: '/' },
    { name: 'WordPress', url: '/solutions/wordpress' },
    { name: activeLocale === 'he' ? 'חבילת אבטחה' : 'Security package', url: '/services/wordpress-security' },
  ], activeLocale);

  return (
    <main className="overflow-hidden bg-[#f6f9fa] text-slate-900 dark:bg-[#071321] dark:text-white">
      <Script id="wp-security-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="wp-security-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="wp-security-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageSchema(faq)) }} />

      {/* Editorial opening: one promise, one clear price, and a non-fictional illustration of the review scope. */}
      <section className="relative isolate overflow-hidden bg-[#071a28] pb-20 pt-32 text-white sm:pb-28 lg:pt-40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-48 start-[48%] h-[640px] w-[720px] rounded-full bg-[#237aa0]/15 blur-[110px]" />
          <div className="absolute bottom-0 start-[-12%] h-80 w-96 rounded-full bg-[#a1c55a]/[0.08] blur-[110px]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(149,189,199,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(149,189,199,0.055)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 xl:gap-24">
          <div className="max-w-[720px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#a1c55a]/25 bg-[#a1c55a]/[0.07] px-3.5 py-2 text-xs font-semibold tracking-wide text-[#c8e798]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b1d96e]" aria-hidden="true" />
              {t('eyebrow')}
            </div>

            <h1 className="mt-8 max-w-[760px] text-[clamp(2.8rem,5.1vw,5.15rem)] font-black leading-[1.08] tracking-[-0.035em]">
              {t('title')}
              <span className="mt-2 block text-[#b4d779]">{t('titleAccent')}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">{t('subtitle')}</p>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-7">
              <div className="flex items-baseline gap-2">
                <strong className="text-[3.65rem] font-black leading-none tracking-tight tabular-nums text-white sm:text-[4.25rem]" dir="ltr">{t('offer.price')}</strong>
                <span className="max-w-32 text-sm leading-5 text-slate-300">{t('offer.afterPrice')}</span>
              </div>
              <div className="hidden h-10 w-px bg-white/20 sm:block" aria-hidden="true" />
              <p className="max-w-52 text-sm leading-6 text-slate-300">{t('offer.detail')}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#security-request" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#b4d779] px-7 py-3.5 text-base font-extrabold text-[#071a28] shadow-[0_12px_40px_-14px_rgba(180,215,121,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#c6e69b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4d779]">
                {t('primaryCta')}
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a href="#what-we-check" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {t('secondaryCta')}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-400">{t('offer.disclosure')}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[545px] lg:mx-0">
            <div className="absolute -inset-4 rounded-[2.5rem] border border-white/[0.04]" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.7rem] border border-white/15 bg-[#102c3b]/90 p-5 shadow-[0_34px_90px_-40px_rgba(0,0,0,.7)] backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#a1c55a]/30 bg-[#a1c55a]/10 text-[#c8e798]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">CartShift / Security</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{t('visual.subline')}</p>
                  </div>
                </div>
                <span className="rounded-md border border-white/15 px-2.5 py-1 font-mono text-[11px] text-slate-300" dir="ltr">WP / 01</span>
              </div>

              <div className="relative mx-auto mt-8 flex h-40 items-center justify-center sm:h-44">
                <div className="absolute h-40 w-40 rounded-full border border-[#74adc4]/20 sm:h-44 sm:w-44" aria-hidden="true" />
                <div className="absolute h-28 w-28 rounded-full border border-dashed border-[#9cc0cc]/25" aria-hidden="true" />
                <div className="absolute h-56 w-56 rounded-full border border-white/[0.055] sm:h-64 sm:w-64" aria-hidden="true" />
                <div className="relative flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-[1.6rem] border border-[#afd68e]/30 bg-[#244e59] shadow-[0_24px_65px_-22px_rgba(12,24,38,.95)]">
                  <ShieldCheck className="h-12 w-12 rotate-[8deg] text-[#c9e69b]" strokeWidth={1.4} aria-hidden="true" />
                </div>
              </div>

              <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#a4c7d4]">{t('visual.title')}</p>
              <div className="mt-5 grid gap-2">
                {features.slice(0, 4).map((feature, index) => {
                  const Icon = featureIcons[index] ?? ShieldCheck;
                  return (
                    <div key={feature.title} className="flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 py-2.5">
                      <span className="font-mono text-[11px] text-[#8db4c5]">{String(index + 1).padStart(2, '0')}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-[#bdd7e2]">
                        <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold leading-5 text-slate-100">{feature.title}</span>
                      <span className="ms-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#b4d779]/40" aria-hidden="true"><span className="h-1 w-1 rounded-full bg-[#b4d779]" /></span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">{t('visual.illustration')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compact trust strip instead of repeating large generic cards. */}
      <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0d1e2c]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 md:grid-cols-3 md:gap-8">
          {trustNotes.map(note => (
            <div key={note} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600 dark:text-[#b4d779]" aria-hidden="true" />
              {note}
            </div>
          ))}
        </div>
      </section>

      {/* Context: the trigger and the actual value are distinct. */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,.7fr)_minmax(0,1fr)] lg:gap-28">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-primary-700 dark:text-primary-300">{t('sectionLabels.context')}</span>
            <h2 className="mt-5 max-w-lg text-3xl font-black leading-[1.18] tracking-tight sm:text-[2.6rem]">{t('whyTitle')}</h2>
          </div>
          <div className="lg:pt-8">
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{t('whyText')}</p>
            <div className="mt-8 border-s-2 border-primary-500/60 ps-5">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('alertTitle')}</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">{t('alertText')}</p>
              <a href="https://digital.nhs.uk/cyber-alerts/2026/cc-4875" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-700 underline-offset-4 hover:underline dark:text-primary-300">
                {t('alertLink')}
                <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Clean editorial service grid: no identical lifted-card wall. */}
      <section id="what-we-check" className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-20 dark:border-white/10 dark:bg-[#0c1b2b] sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-primary-700 dark:text-primary-300">{t('sectionLabels.coverage')}</span>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-[2.65rem]">{t('serviceTitle')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{t('serviceIntro')}</p>
          </div>

          <div className="mt-12 grid gap-x-14 md:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = featureIcons[index] ?? ShieldCheck;
              return (
                <article key={feature.title} className="group flex gap-5 border-t border-slate-200 py-7 dark:border-white/10 sm:gap-6 sm:py-8">
                  <div className="flex w-12 shrink-0 flex-col items-start gap-5">
                    <span className="font-mono text-xs font-bold text-primary-600 dark:text-[#b4d779]">{String(index + 1).padStart(2, '0')}</span>
                    <Icon className="h-6 w-6 text-slate-400 transition-colors group-hover:text-primary-600 dark:text-slate-500 dark:group-hover:text-[#b4d779]" strokeWidth={1.6} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold leading-snug tracking-tight">{feature.title}</h3>
                    <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offer details are grouped once, with hard commercial boundaries. */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.82fr_1.18fr] lg:items-stretch">
          <div className="relative flex flex-col overflow-hidden rounded-[1.8rem] bg-[#0d2b3a] p-7 text-white sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -end-20 -top-24 h-80 w-80 rounded-full bg-[#2d7991]/25 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-[#b4d779]/30 bg-[#b4d779]/10 px-3 py-1.5 text-xs font-bold tracking-wide text-[#c6e89c]">{t('offer.label')}</span>
              <h2 className="mt-7 max-w-md text-[2.05rem] font-black leading-tight tracking-tight sm:text-[2.65rem]">{t('offer.headline')}</h2>
              <div className="mt-8 flex items-end gap-3">
                <strong className="text-[4.5rem] font-black leading-none tracking-[-.045em] tabular-nums sm:text-[5.25rem]" dir="ltr">{t('offer.price')}</strong>
                <span className="pb-2 text-sm leading-5 text-slate-300">{t('offer.beforePrice')}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-200">{t('offer.afterPrice')}</p>
              <div className="mt-8 space-y-3 border-t border-white/15 pt-6 text-sm text-slate-200">
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#b4d779]" aria-hidden="true" />{t('offer.detail')}</div>
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#b4d779]" aria-hidden="true" />{t('offer.approval')}</div>
              </div>
            </div>
            <div className="relative mt-auto pt-9">
              <a href="#security-request" className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#b4d779] px-5 py-3.5 text-center text-base font-black text-[#081b28] transition-colors hover:bg-[#c6e69b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4d779]">
                {t('primaryCta')}
                <ArrowLeft className="h-5 w-5 ltr:rotate-180" aria-hidden="true" />
              </a>
              <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">{t('offer.disclosure')}</p>
            </div>
          </div>

          <div className="flex flex-col rounded-[1.8rem] border border-slate-200 bg-white p-7 dark:border-white/10 dark:bg-[#102334] sm:p-10 lg:p-12">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">{t('offer.includedTitle')}</h3>
              <ul className="mt-6 divide-y divide-slate-100 dark:divide-white/10">
                {included.map(item => (
                  <li key={item} className="flex gap-3 py-3.5 text-sm font-medium leading-6 text-slate-700 first:pt-0 dark:text-slate-200">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-[#b4d779]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-7 border-t border-slate-200 pt-7 dark:border-white/10">
              <h3 className="text-base font-extrabold">{t('offer.excludedTitle')}</h3>
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {excluded.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    <X className="mt-1 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">{t('scopeText')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three small steps instead of another hero-sized repeat. */}
      <section className="border-y border-slate-200 bg-white px-5 py-20 dark:border-white/10 dark:bg-[#0c1b2b] sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <span className="text-xs font-bold uppercase tracking-[.18em] text-primary-700 dark:text-primary-300">{t('sectionLabels.process')}</span>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-[2.5rem]">{t('processTitle')}</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {process.map((item, index) => (
              <li key={item.title} className="border-t-2 border-primary-500/40 pt-6">
                <span className="font-mono text-3xl font-bold text-primary-700 dark:text-[#b4d779]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Conversion after explanation; still linked from the first viewport. */}
      <section id="security-request" className="relative scroll-mt-16 overflow-hidden bg-[#071a28] px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="pointer-events-none absolute -start-40 -top-40 h-96 w-96 rounded-full bg-primary-500/15 blur-[100px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1fr)] lg:items-center lg:gap-20">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#b4d779]">{t('sectionLabels.next')}</span>
            <h2 className="mt-5 max-w-lg text-4xl font-black leading-[1.14] tracking-tight sm:text-5xl">{t('conversion.title')}</h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">{t('conversion.description')}</p>
            <div className="mt-9 max-w-md border-t border-white/15 pt-7">
              <p className="flex items-center gap-3 text-sm font-semibold text-slate-100">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#b4d779]" aria-hidden="true" />
                {t('offer.approval')}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">{t('offer.fitNote')}</p>
            </div>
          </div>
          <WordPressSecurityLeadForm />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.55fr_1fr] lg:gap-20">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-primary-700 dark:text-primary-300">{t('sectionLabels.faq')}</span>
            <h2 className="mt-5 max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-[2.5rem]">{t('faqTitle')}</h2>
          </div>
          <div className="border-t border-slate-200 dark:border-white/15">
            {faq.map(item => (
              <details key={item.question} className="group border-b border-slate-200 py-5 dark:border-white/15">
                <summary className="flex min-h-7 cursor-pointer list-none items-start justify-between gap-5 text-base font-bold leading-7 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <Plus className="mt-1 h-5 w-5 shrink-0 text-primary-700 transition-transform group-open:rotate-45 dark:text-[#b4d779]" aria-hidden="true" />
                </summary>
                <p className="max-w-2xl pb-2 pt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
            <a href="#security-request" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 dark:bg-[#b4d779] dark:text-[#081b28] dark:hover:bg-[#c6e69b]">
              {t('primaryCta')}
              <ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
