'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Link } from '@/i18n/navigation';
import type { CaseStudyMeta } from '@/lib/case-studies';
import { getCaseStudyThemeStyle } from '@/lib/case-study-theme';

interface WorkPageContentProps {
  caseStudies?: CaseStudyMeta[];
}

function getProjectProof(caseStudy: CaseStudyMeta) {
  const evidence = caseStudy.evidence[0];
  if (evidence?.value) {
    return `${evidence.value} ${evidence.title}`.trim();
  }

  if (evidence) {
    return evidence.title;
  }

  const legacy = caseStudy.results[0];
  if (legacy) {
    return `${legacy.improvement} ${legacy.metric}`.trim();
  }

  return caseStudy.platform;
}

export const WorkPageContent: React.FC<WorkPageContentProps> = ({ caseStudies = [] }) => {
  const t = useTranslations();
  const [activeFilter, setActiveFilter] = useState<'all' | 'shopify' | 'wordpress'>('all');
  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 520], [0, 120]);
  const heroImageScale = useTransform(scrollY, [0, 520], [1, 1.04]);
  const heroCopyY = useTransform(scrollY, [0, 380], [0, 24]);
  const filterRailY = useTransform(scrollY, [120, 560], [0, -12]);
  const filterRailOpacity = useTransform(scrollY, [40, 280], [0.82, 1]);
  const gridY = useTransform(scrollY, [240, 760], [26, 0]);

  const work = t.raw('work' as never) as {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      badge: string;
    };
    filters: { all: string; shopify: string; wordpress: string };
    cta: { title: string; titleSpan: string; description: string; button: string };
    detail: {
      selectedScreens: string;
      evidenceTitle: string;
    };
    viewProject: string;
    empty: { title: string; description: string };
  };

  const filteredCaseStudies = useMemo(() => {
    if (activeFilter === 'all') {
      return caseStudies;
    }

    return caseStudies.filter(study => study.platform.toLowerCase().includes(activeFilter));
  }, [activeFilter, caseStudies]);

  const collageStudies = filteredCaseStudies.slice(0, 5);
  const portfolioStats = useMemo(
    () => [
      { value: caseStudies.length, label: work.filters.all },
      {
        value: caseStudies.filter(study => study.platform.toLowerCase().includes('shopify')).length,
        label: work.filters.shopify,
      },
      {
        value: caseStudies.filter(study => study.platform.toLowerCase().includes('wordpress'))
          .length,
        label: work.filters.wordpress,
      },
    ],
    [caseStudies, work.filters.all, work.filters.shopify, work.filters.wordpress]
  );

  const filters: Array<{ key: 'all' | 'shopify' | 'wordpress'; label: string }> = [
    { key: 'all', label: work.filters.all },
    { key: 'shopify', label: work.filters.shopify },
    { key: 'wordpress', label: work.filters.wordpress },
  ];

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: work.hero.title, href: '/work' },
  ];

  return (
    <div className="bg-surface-50 text-surface-950 transition-colors dark:bg-[#050816] dark:text-white">
      <section className="relative isolate overflow-hidden bg-[#eef4fb] text-surface-950 dark:bg-surface-950 dark:text-white">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4fb_40%,#e2e8f0_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#071224_40%,#020617_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.18),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
        {collageStudies.length > 0 && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 end-[-8%] hidden w-[min(66rem,64vw)] xl:block"
            style={{ y: heroImageY, scale: heroImageScale }}
          >
            <div className="grid h-full grid-cols-[1.08fr_0.92fr] gap-5 px-8 py-10">
              <div className="grid gap-5 pt-10">
                {collageStudies.slice(0, 2).map((caseStudy, index) => (
                  <HeroCollagePanel
                    key={`${caseStudy.slug}-lead`}
                    caseStudy={caseStudy}
                    priority={index === 0}
                    className={index === 0 ? 'aspect-[16/11]' : 'ms-12 aspect-[15/10]'}
                  />
                ))}
              </div>
              <div className="grid gap-5">
                {collageStudies.slice(2, 5).map((caseStudy, index) => (
                  <HeroCollagePanel
                    key={`${caseStudy.slug}-accent`}
                    caseStudy={caseStudy}
                    className={
                      index === 0
                        ? 'me-10 mt-8 aspect-[4/5]'
                        : index === 1
                          ? 'aspect-[16/10]'
                          : 'me-14 aspect-[14/9]'
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,250,252,0.96)_0%,rgba(241,245,249,0.9)_34%,rgba(241,245,249,0.72)_66%,rgba(226,232,240,0.92)_100%)] dark:bg-[linear-gradient(90deg,rgba(2,6,23,0.94)_0%,rgba(2,6,23,0.84)_36%,rgba(2,6,23,0.58)_70%,rgba(2,6,23,0.92)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="mb-10">
            <div className="inline-flex rounded-full border border-surface-200/80 bg-white/78 px-4 py-2 backdrop-blur-xl dark:border-white/15 dark:bg-black/20">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-3xl"
              style={{ y: heroCopyY }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-200/80 bg-white/78 px-4 py-2 text-sm font-semibold text-surface-950 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white">
                <Sparkles className="h-4 w-4" />
                {work.hero.badge}
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-[0.94] tracking-[-0.04em] text-surface-950 sm:text-5xl lg:text-7xl dark:text-white">
                {work.hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium text-surface-700 dark:text-white/[0.75]">
                {work.hero.subtitle}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-surface-700 dark:text-white/[0.76] sm:text-lg">
                {work.hero.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-surface-200/80 bg-white/84 px-4 py-2 font-medium text-surface-950 shadow-[0_12px_30px_-22px_rgba(148,163,184,0.45)] backdrop-blur-md dark:border-white/16 dark:bg-surface-950/88 dark:text-white dark:shadow-[0_18px_36px_-24px_rgba(2,6,23,0.55)]">
                  {work.detail.selectedScreens}
                </span>
                <span className="rounded-full border border-surface-200/80 bg-white/84 px-4 py-2 font-medium text-surface-950 shadow-[0_12px_30px_-22px_rgba(148,163,184,0.45)] backdrop-blur-md dark:border-white/16 dark:bg-surface-950/88 dark:text-white dark:shadow-[0_18px_36px_-24px_rgba(2,6,23,0.55)]">
                  {work.detail.evidenceTitle}
                </span>
              </div>
            </motion.div>

            {collageStudies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
                className="grid grid-cols-2 gap-3 sm:gap-4 xl:hidden"
              >
                {collageStudies.slice(0, 4).map((caseStudy, index) => (
                  <HeroCollagePanel
                    key={`${caseStudy.slug}-mobile`}
                    caseStudy={caseStudy}
                    priority={index === 0}
                    className={index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[5/6]'}
                  />
                ))}
              </motion.div>
            )}
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {portfolioStats.map(stat => (
              <div
                key={stat.label}
                className="rounded-[1.7rem] border border-surface-200/80 bg-white/72 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-white/54">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-surface-950 sm:text-4xl dark:text-white">
                  {String(stat.value).padStart(2, '0')}
                </p>
              </div>
            ))}
          </div>

          <motion.div
            className="mt-8 flex flex-wrap gap-2"
            style={{ y: filterRailY, opacity: filterRailOpacity }}
          >
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === filter.key
                    ? 'border-surface-300 bg-surface-950 text-white dark:border-white/40 dark:bg-white dark:text-surface-950'
                    : 'border-surface-200/80 bg-white/72 text-surface-700 hover:bg-white dark:border-white/12 dark:bg-white/[0.08] dark:text-white/[0.78] dark:hover:bg-white/12'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-14 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-surface-200 dark:bg-white/8" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div style={{ y: gridY }}>
            {filteredCaseStudies.length === 0 ? (
              <div className="rounded-[2rem] border border-surface-200 bg-white px-6 py-14 text-center shadow-[0_24px_70px_-48px_rgba(15,23,42,0.3)] dark:border-surface-800 dark:bg-surface-900/72">
                <p className="text-2xl font-semibold text-surface-900 dark:text-white">
                  {work.empty.title}
                </p>
                <p className="mt-3 text-base text-surface-600 dark:text-surface-300">
                  {work.empty.description}
                </p>
              </div>
            ) : (
              <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCaseStudies.map(caseStudy => (
                  <Link
                    key={caseStudy.slug}
                    href={`/work/${caseStudy.slug}`}
                    className="block h-full"
                  >
                    <PortfolioWorkTile caseStudy={caseStudy} ctaLabel={work.viewProject} />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="overflow-hidden rounded-[2.5rem] border border-surface-200/80 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)] px-6 py-10 text-surface-950 shadow-[0_28px_90px_-54px_rgba(148,163,184,0.38)] dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.96)_0%,rgba(7,16,29,0.98)_100%)] dark:text-white dark:shadow-[0_34px_110px_-60px_rgba(0,0,0,0.8)] sm:px-10 lg:px-14 lg:py-14"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-surface-500 dark:text-white/70">
                  {work.cta.title}
                </p>
                <h2 className="text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  {work.cta.title}{' '}
                  <span className="text-surface-500 dark:text-white/82">{work.cta.titleSpan}</span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-white/80 sm:text-lg">
                  {work.cta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href="/contact">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
                    {work.cta.button}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

function PortfolioWorkTile({
  caseStudy,
  ctaLabel,
}: {
  caseStudy: CaseStudyMeta;
  ctaLabel: string;
}) {
  const themeStyle = getCaseStudyThemeStyle(caseStudy.brand);
  const metaLine = caseStudy.duration
    ? `${caseStudy.client} / ${caseStudy.duration}`
    : caseStudy.client;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{
        ...themeStyle,
        boxShadow: '0 30px 84px -52px rgba(var(--case-shadow-rgb), 0.48)',
      }}
      className="group isolate flex h-full flex-col overflow-hidden rounded-[2rem] border border-[rgba(var(--case-border-rgb),0.42)] bg-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[rgba(var(--case-primary-rgb),0.34)] hover:shadow-[0_42px_96px_-46px_rgba(2,6,23,0.5)] dark:border-[rgba(var(--case-dark-border-rgb),0.7)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.88)]"
    >
      <div className="relative min-h-[18.5rem] overflow-hidden bg-surface-950 sm:min-h-[19.5rem]">
        <Image
          src={caseStudy.thumbnail || caseStudy.hero.image}
          alt={caseStudy.hero.alt}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
          sizes="(min-width: 1280px) 28vw, (min-width: 768px) 46vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.12)_0%,rgba(2,6,23,0.18)_40%,rgba(2,6,23,0.88)_100%)]" />
        <div
          className="absolute inset-0 opacity-75"
          style={{
            background:
              'linear-gradient(180deg, rgba(var(--case-primary-rgb), 0.08), rgba(var(--case-primary-rgb), 0.26))',
          }}
        />
        <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4">
          <span
            className="rounded-full border border-surface-200/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-surface-950 shadow-[0_12px_24px_-18px_rgba(148,163,184,0.5)] backdrop-blur-md dark:border-white/16 dark:bg-surface-950/84 dark:text-white dark:shadow-[0_18px_28px_-20px_rgba(2,6,23,0.6)]"
            style={{
              backgroundColor: 'rgba(var(--case-primary-rgb), 0.18)',
            }}
          >
            {caseStudy.platform}
          </span>
          <span className="rounded-full border border-surface-200/80 bg-white/82 px-3 py-1 text-xs font-semibold text-surface-900 shadow-[0_12px_24px_-18px_rgba(148,163,184,0.5)] backdrop-blur-md dark:border-white/16 dark:bg-surface-950/84 dark:text-white dark:shadow-[0_18px_28px_-20px_rgba(2,6,23,0.6)]">
            {getProjectProof(caseStudy)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-surface-200/80 bg-white/82 px-4 py-2 text-sm font-medium text-surface-900 shadow-[0_16px_30px_-20px_rgba(148,163,184,0.5)] backdrop-blur-md dark:border-white/16 dark:bg-surface-950/84 dark:text-white dark:shadow-[0_20px_34px_-22px_rgba(2,6,23,0.62)]">
            <span className="truncate">{caseStudy.client}</span>
            <span className="text-surface-400 dark:text-white/38">/</span>
            <span className="truncate">{caseStudy.industry}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-surface-400">
          {metaLine}
        </p>
        <h3 className="mt-4 line-clamp-2 text-[1.75rem] font-semibold leading-[1.02] tracking-[-0.04em] text-surface-950 dark:text-white">
          {caseStudy.title}
        </h3>
        <p className="mt-4 line-clamp-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
          {caseStudy.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-1 text-sm font-medium text-surface-900 dark:text-white"
            style={{ backgroundColor: 'rgba(var(--case-accent-rgb), 0.16)' }}
          >
            {caseStudy.industry}
          </span>
          <span className="rounded-full border border-surface-200/80 bg-surface-100 px-3 py-1 text-sm font-medium text-surface-700 dark:border-white/14 dark:bg-surface-950 dark:!text-white dark:shadow-[0_18px_28px_-20px_rgba(2,6,23,0.6)]">
            {caseStudy.platform}
          </span>
        </div>
        <div className="mt-auto pt-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-surface-950 transition-transform duration-300 group-hover:translate-x-1 dark:text-white rtl:group-hover:-translate-x-1">
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function HeroCollagePanel({
  caseStudy,
  className,
  priority = false,
}: {
  caseStudy: CaseStudyMeta;
  className: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border border-surface-200/80 bg-white/76 shadow-[0_32px_80px_-44px_rgba(148,163,184,0.3)] dark:border-white/10 dark:bg-surface-900/80 dark:shadow-[0_32px_80px_-44px_rgba(2,6,23,0.56)] ${className}`}
    >
      <Image
        src={caseStudy.thumbnail || caseStudy.hero.image}
        alt={caseStudy.hero.alt}
        fill
        priority={priority}
        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
        sizes="(min-width: 1280px) 22vw, (min-width: 640px) 42vw, 100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.04)_0%,rgba(226,232,240,0.12)_42%,rgba(15,23,42,0.48)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.18)_52%,rgba(2,6,23,0.82)_100%)]" />
    </div>
  );
}
