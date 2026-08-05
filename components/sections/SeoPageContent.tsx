'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  FileText,
  Gauge,
  LineChart,
  ListChecks,
  MapPin,
  Newspaper,
  RefreshCw,
  Rocket,
  Search,
  SearchCheck,
  ShoppingCart,
  Store,
  Target,
  Wrench,
} from 'lucide-react';
import { motion } from '@/lib/motion';
import { Link } from '@/i18n/navigation';
import { trackHighIntentCta } from '@/lib/marketing-cta';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FAQ, type FAQItem } from '@/components/ui/FAQ';
import { cn } from '@/lib/utils';

const SHOW_PUBLIC_SEO_PRICING = true;

interface CapabilityItem {
  title: string;
  description: string;
}

interface ServiceItem {
  title: string;
  description: string;
  details: string[];
}

interface AudienceItem {
  title: string;
  description: string;
}

interface PackageItem {
  name: string;
  price: string;
  description: string;
  includes: string[];
}

interface ProcessItem {
  title: string;
  description: string;
  deliverable: string;
}

const capabilityIcons = [SearchCheck, ListChecks, Wrench] as const;
const capabilityIds = ['diagnose', 'prioritize', 'implement'] as const;

const serviceIcons = [FileSearch, FileText, MapPin, Gauge, LineChart, RefreshCw] as const;
const serviceIds = ['technical', 'content', 'local', 'performance', 'analytics', 'growth'] as const;

const audienceIcons = [Store, ShoppingCart, BriefcaseBusiness, Newspaper, Rocket] as const;
const audienceIds = ['local', 'ecommerce', 'b2b', 'content', 'saas'] as const;
const packageIds = ['audit', 'foundation', 'growth'] as const;
const processIds = ['discovery', 'roadmap', 'implementation', 'measurement'] as const;

export const SeoPageContent: React.FC = () => {
  const t = useTranslations();
  const capabilities = t.raw('seo.differentiator.capabilities') as CapabilityItem[];
  const services = t.raw('seo.services.items') as ServiceItem[];
  const audiences = t.raw('seo.audiences.items') as AudienceItem[];
  const packages = t.raw('seo.pricing.packages') as PackageItem[];
  const pricingNotes = t.raw('seo.pricing.notes') as string[];
  const process = t.raw('seo.process.items') as ProcessItem[];
  const metrics = t.raw('seo.measurement.metrics') as string[];
  const faqItems = t.raw('seo.faq.items') as FAQItem[];

  return (
    <div className="bg-background text-surface-900 transition-colors duration-500 dark:bg-black dark:text-white">
      <Section background="default" className="py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-20">
          <div className="relative max-w-xl text-start lg:sticky lg:top-32 lg:self-start">
            <div
              className="absolute -start-10 top-2 hidden h-36 w-px bg-gradient-to-b from-primary-500 via-primary-500/40 to-transparent lg:block"
              aria-hidden="true"
            />
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {t('seo.differentiator.title')}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              {t('seo.differentiator.description')}
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-primary-500/20 bg-primary-500/8 px-4 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300">
              <Target className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('seo.differentiator.positioning')}</span>
            </div>
          </div>

          <div className="relative divide-y divide-surface-200 overflow-hidden rounded-2xl border border-surface-200 bg-white/80 shadow-[0_30px_80px_-54px_rgba(33,117,155,0.7)] dark:divide-white/8 dark:border-white/10 dark:bg-surface-900/60">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(33,117,155,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(33,117,155,0.035)_1px,transparent_1px)] bg-[size:30px_30px]"
              aria-hidden="true"
            />
            {capabilities.map((capability, index) => {
              const CapabilityIcon = capabilityIcons[index];
              const capabilityId = capabilityIds[index];

              return (
                <motion.div
                  key={capabilityId}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex gap-5 p-6 motion-reduce:transform-none sm:p-8"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <CapabilityIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="text-start">
                    <h3 className="font-display text-xl font-bold">{capability.title}</h3>
                    <p className="mt-2 leading-relaxed text-surface-600 dark:text-surface-300">
                      {capability.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section
        background="light"
        className="border-y border-surface-200 bg-[radial-gradient(circle_at_50%_0%,rgba(33,117,155,0.12),transparent_38%)] py-20 dark:border-white/8 md:py-28"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(33,117,155,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(33,117,155,0.035)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
          aria-hidden="true"
        />
        <SectionHeader
          title={t('seo.services.title')}
          subtitle={t('seo.services.subtitle')}
          className="relative"
        />
        <div className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-[0_36px_100px_-58px_rgba(33,117,155,0.75)] dark:border-white/10 dark:bg-surface-900/70">
          {services.map((service, index) => {
            const ServiceIcon = serviceIcons[index];
            const serviceId = serviceIds[index];

            return (
              <motion.div
                key={serviceId}
                whileHover={{ backgroundColor: 'rgba(33, 117, 155, 0.055)' }}
                transition={{ duration: 0.2 }}
                className="group relative grid gap-6 overflow-hidden border-b border-surface-200 p-6 last:border-b-0 dark:border-white/8 sm:p-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-12 lg:p-10"
              >
                <ServiceIcon
                  className="pointer-events-none absolute -end-6 -top-8 h-32 w-32 text-primary-500/[0.035] transition-transform duration-500 group-hover:scale-110 dark:text-primary-300/[0.025]"
                  strokeWidth={0.8}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-4 text-start">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-primary-600 dark:bg-white/6 dark:text-primary-400">
                    <ServiceIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold sm:text-2xl">{service.title}</h3>
                    <p className="mt-3 leading-relaxed text-surface-600 dark:text-surface-300">
                      {service.description}
                    </p>
                  </div>
                </div>
                <ul className="grid content-start gap-3 sm:grid-cols-2" aria-label={service.title}>
                  {service.details.map(detail => (
                    <li
                      key={detail}
                      className="flex items-start gap-3 rounded-xl border border-surface-200/80 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 dark:border-white/7 dark:bg-black/20 dark:text-surface-200"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section background="default" className="py-20 md:py-28">
        <SectionHeader title={t('seo.audiences.title')} subtitle={t('seo.audiences.subtitle')} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {audiences.map((audience, index) => {
            const AudienceIcon = audienceIcons[index];
            const audienceId = audienceIds[index];

            return (
              <motion.div
                key={audienceId}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-surface-200 bg-white/80 p-6 text-start shadow-[0_18px_45px_-38px_rgba(33,117,155,0.8)] motion-reduce:transform-none dark:border-white/9 dark:bg-surface-900/55',
                  index < 2 ? 'lg:col-span-3' : 'lg:col-span-2'
                )}
              >
                <div
                  className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(33,117,155,0.12),transparent_48%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 rtl:bg-[radial-gradient(circle_at_0%_0%,rgba(33,117,155,0.12),transparent_48%)]"
                  aria-hidden="true"
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <AudienceIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{audience.title}</h3>
                <p className="mt-3 leading-relaxed text-surface-600 dark:text-surface-300">
                  {audience.description}
                </p>
              </motion.div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-surface-600 dark:text-surface-300">
          {t('seo.audiences.note')}
        </p>
      </Section>

      <Section
        background="light"
        className="border-y border-surface-200 py-20 dark:border-white/8 md:py-28"
      >
        <SectionHeader title={t('seo.pricing.title')} subtitle={t('seo.pricing.subtitle')} />
        <div className="grid gap-6 lg:grid-cols-3">
          {packages.map((packageItem, index) => {
            const packageId = packageIds[index];
            const isRecommended = packageId === 'growth';
            const price = SHOW_PUBLIC_SEO_PRICING
              ? packageItem.price
              : t('seo.pricing.customScope');

            return (
              <Card
                key={packageId}
                variant={isRecommended ? 'elevated' : 'default'}
                accent={isRecommended ? 'primary' : 'none'}
                hoverEffect={isRecommended ? 'glow' : 'lift'}
                className={cn(
                  'flex h-full flex-col p-0',
                  isRecommended &&
                    'border-primary-500/35 shadow-[0_32px_80px_-44px_rgba(33,117,155,0.85)] dark:border-primary-400/30 lg:-translate-y-4'
                )}
              >
                <CardContent className="flex h-full flex-col p-6 sm:p-8">
                  <div className="min-h-8">
                    {isRecommended && (
                      <span className="inline-flex rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
                        {t('seo.pricing.recommended')}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-bold">{packageItem.name}</h3>
                  <p className="mt-3 min-h-12 leading-relaxed text-surface-600 dark:text-surface-300">
                    {packageItem.description}
                  </p>
                  <p className="mt-6 font-display text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {price}
                  </p>
                  <ul className="mt-8 space-y-4">
                    {packageItem.includes.map(item => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border border-surface-200 bg-surface-50 p-6 text-start dark:border-white/8 dark:bg-black/25 sm:p-8">
          <h3 className="font-display text-lg font-bold">{t('seo.pricing.notesTitle')}</h3>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300 md:grid-cols-2">
            {pricingNotes.map(note => (
              <li key={note} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section background="default" className="py-20 md:py-28">
        <SectionHeader title={t('seo.process.title')} subtitle={t('seo.process.subtitle')} />
        <div className="relative">
          <div
            className="absolute start-[8%] end-[8%] top-12 hidden h-px bg-gradient-to-r from-primary-500/10 via-primary-500/70 to-accent-500/20 lg:block rtl:bg-gradient-to-l"
            aria-hidden="true"
          />
          <ol className="relative grid gap-5 lg:grid-cols-4">
            {process.map((processItem, index) => (
              <li
                key={processIds[index]}
                className="relative rounded-2xl border border-surface-200 bg-white/90 p-6 text-start shadow-[0_22px_60px_-48px_rgba(33,117,155,0.9)] dark:border-white/9 dark:bg-surface-900/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {index < process.length - 1 && (
                    <ArrowRight
                      className="hidden h-5 w-5 text-surface-300 lg:block rtl:rotate-180 dark:text-surface-600"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">{processItem.title}</h3>
                <p className="mt-3 leading-relaxed text-surface-600 dark:text-surface-300">
                  {processItem.description}
                </p>
                <div className="mt-6 border-t border-surface-200 pt-5 dark:border-white/8">
                  <p className="text-xs font-bold text-surface-500 dark:text-surface-400">
                    {t('seo.process.deliverableLabel')}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{processItem.deliverable}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section background="light" className="border-y border-surface-200 py-20 dark:border-white/8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="text-start">
            <div className="relative flex h-28 w-28 items-center justify-center" aria-hidden="true">
              <motion.div
                className="absolute inset-0 rounded-full border border-primary-500/20"
                animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.45, 0.15, 0.45] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-4 rounded-full border border-dashed border-primary-500/30" />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/25 bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <BarChart3 className="h-7 w-7" />
              </div>
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {t('seo.measurement.title')}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              {t('seo.measurement.description')}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
              {t('seo.measurement.note')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3" aria-label={t('seo.measurement.metricsLabel')}>
            {metrics.map(metric => (
              <span
                key={metric}
                className="rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-semibold text-surface-700 dark:border-white/9 dark:bg-surface-900 dark:text-surface-200"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section background="default" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title={t('seo.faq.title')} subtitle={t('seo.faq.subtitle')} />
          <FAQ items={faqItems} allowMultiple showExpandAll animateOnView={false} />
        </div>
      </Section>

      <Section background="default" className="pb-28 pt-8 md:pb-36">
        <div className="relative overflow-hidden rounded-3xl border border-primary-500/25 bg-[radial-gradient(circle_at_50%_0%,rgba(33,117,155,0.2),transparent_45%),linear-gradient(135deg,#ffffff,#eef5f8)] px-6 py-14 text-center text-surface-900 shadow-[0_40px_100px_-50px_rgba(33,117,155,0.55)] dark:border-primary-400/20 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(33,117,155,0.32),transparent_45%),linear-gradient(135deg,#0f172a,#111c31)] dark:text-white dark:shadow-[0_40px_100px_-50px_rgba(33,117,155,0.85)] sm:px-10 md:py-20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] dark:opacity-[0.08]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent" />
          <div className="relative mx-auto max-w-3xl">
            <Search
              className="mx-auto h-10 w-10 text-primary-600 dark:text-primary-300"
              aria-hidden="true"
            />
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {t('seo.cta.title')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              {t('seo.cta.description')}
            </p>
            <Link
              href="/contact?projectType=seo"
              onClick={() =>
                trackHighIntentCta({
                  ctaText: t('seo.cta.button'),
                  ctaLocation: 'seo_final_cta',
                  intent: 'seo_consultation',
                  source: 'service_page_cta',
                })
              }
              className="mt-9 inline-flex"
            >
              <Button size="lg" className="min-h-12 px-7">
                {t('seo.cta.button')}
                <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
};
