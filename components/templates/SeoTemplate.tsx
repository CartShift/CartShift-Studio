'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Code2, MousePointerClick, Radar } from 'lucide-react';
import { motion } from '@/lib/motion';
import { PageHero } from '@/components/sections/PageHero';
import { SeoPageContent } from '@/components/sections/SeoPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface HeroSignal {
  title: string;
  description: string;
}

const signalIcons = [Radar, Code2, MousePointerClick] as const;
const signalIds = ['intent', 'implementation', 'outcome'] as const;

export const SeoTemplate: React.FC = () => {
  const t = useTranslations();
  const heroSignals = t.raw('seo.hero.signals') as HeroSignal[];

  const breadcrumbItems = [
    { label: t('seo.breadcrumb.home'), href: '/' },
    { label: t('seo.breadcrumb.solutions'), href: '/' },
    { label: t('seo.breadcrumb.current'), href: '/solutions/seo' },
  ];

  return (
    <>
      <PageHero
        title={t('seo.hero.title')}
        subtitle={t('seo.hero.subtitle')}
        description={t('seo.hero.description')}
        seoH1={t('seo.hero.seoH1')}
        highlightLastWord={false}
      >
        <div className="relative mx-auto max-w-4xl text-start">
          <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(33,117,155,0.2),transparent_66%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-surface-200/90 bg-white/90 shadow-[0_30px_90px_-42px_rgba(33,117,155,0.45)] backdrop-blur-xl dark:border-primary-400/20 dark:bg-[#080d16] dark:shadow-[0_30px_90px_-30px_rgba(33,117,155,0.72)]">
            <div className="flex items-center justify-between border-b border-surface-200/80 px-4 py-3 dark:border-primary-400/15 dark:bg-white/[0.025] sm:px-5">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-primary-400" />
                <span className="h-2 w-2 rounded-full bg-surface-300 dark:bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-accent-400" />
              </div>
              <span className="font-display text-xs font-semibold tracking-wide text-surface-500 dark:text-surface-400">
                {t('seo.hero.consoleLabel')}
              </span>
            </div>
            <div className="relative grid gap-0 md:grid-cols-3">
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(33,117,155,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(33,117,155,0.045)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)]"
                aria-hidden="true"
              />
              {heroSignals.map((signal, index) => {
                const SignalIcon = signalIcons[index];
                return (
                  <div
                    key={signalIds[index]}
                    className="relative flex min-h-36 items-center gap-4 border-b border-surface-200/80 p-5 last:border-b-0 dark:border-primary-400/15 dark:bg-[#0b1321]/75 md:border-b-0 md:border-e md:last:border-e-0 sm:p-6"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-500/25 bg-primary-500/10 text-primary-700 dark:border-primary-400/25 dark:bg-primary-400/10 dark:text-primary-300">
                      <SignalIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-surface-900 dark:text-white">
                        {signal.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                        {signal.description}
                      </p>
                    </div>
                    {index < heroSignals.length - 1 && (
                      <ArrowRight
                        className="absolute -end-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-surface-200 bg-white p-1 text-primary-600 dark:border-primary-400/30 dark:bg-[#080d16] dark:text-primary-300 md:block rtl:rotate-180"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div
              className="relative h-1 overflow-hidden bg-surface-200/70 dark:bg-primary-950"
              aria-hidden="true"
            >
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary-400 to-accent-400"
                animate={{ insetInlineStart: ['-35%', '110%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
        </div>
      </PageHero>
      <div className="border-b border-surface-200 bg-surface-50 dark:border-white/5 dark:bg-black">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} includeJsonLd={false} />
        </div>
      </div>
      <SeoPageContent />
    </>
  );
};
