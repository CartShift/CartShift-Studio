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
  const heroCopyY = useTransform(scrollY, [0, 380], [0, 26]);

  const work = t.raw('work' as never) as {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      badge: string;
      featuredLabel: string;
    };
    filters: { all: string; shopify: string; wordpress: string };
    cta: { title: string; titleSpan: string; description: string; button: string };
    detail: {
      client: string;
      industry: string;
      platform: string;
      duration: string;
      visitSite: string;
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

  const showcaseStudies = filteredCaseStudies.slice(0, 3);
  const heroStudy = showcaseStudies[0];

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
    <div className="bg-white text-surface-900 dark:bg-surface-950 dark:text-white">
      <section className="relative isolate overflow-hidden bg-surface-950 text-white">
        {heroStudy?.hero.image && (
          <motion.div className="absolute inset-0" style={{ y: heroImageY, scale: heroImageScale }}>
            <Image
              src={heroStudy.hero.image}
              alt={heroStudy.hero.alt}
              fill
              priority
              className="object-cover object-top"
              sizes="100vw"
            />
          </motion.div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.56)_0%,rgba(2,6,23,0.78)_52%,rgba(2,6,23,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="mb-10">
            <div className="inline-flex rounded-full border border-white/15 bg-black/20 px-4 py-2 backdrop-blur-xl">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.92fr)] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-3xl"
              style={{ y: heroCopyY }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
                {work.hero.badge}
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
                {work.hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium text-white/[0.75]">
                {work.hero.subtitle}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/[0.76] sm:text-lg">
                {work.hero.description}
              </p>
            </motion.div>

            {showcaseStudies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
                className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl sm:p-5"
              >
                <div className="grid gap-3">
                  {showcaseStudies.map(caseStudy => (
                    <Link key={caseStudy.slug} href={`/work/${caseStudy.slug}`} className="block">
                      <article className="group grid min-h-[8.75rem] grid-cols-[6.5rem_minmax(0,1fr)] gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-3 transition-colors hover:bg-white/[0.08]">
                        <div className="relative overflow-hidden rounded-[1.1rem]">
                          <Image
                            src={caseStudy.thumbnail || caseStudy.hero.image}
                            alt={caseStudy.hero.alt}
                            fill
                            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                            sizes="160px"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.58)_100%)]" />
                        </div>
                        <div className="flex min-w-0 flex-col justify-between py-1">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/52">
                              {caseStudy.platform}
                            </p>
                            <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.03em] text-white">
                              {caseStudy.title}
                            </h2>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/66">
                              {caseStudy.client}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="line-clamp-1 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-medium text-white/78">
                              {getProjectProof(caseStudy)}
                            </span>
                            <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-12 flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === filter.key
                    ? 'border-white/40 bg-white text-surface-950'
                    : 'border-white/12 bg-white/[0.08] text-white/[0.78] hover:bg-white/12'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCaseStudies.length === 0 ? (
            <div className="rounded-[2rem] border border-surface-200 bg-surface-50 px-6 py-14 text-center dark:border-surface-800 dark:bg-surface-900/72">
              <p className="text-2xl font-semibold text-surface-900 dark:text-white">
                {work.empty.title}
              </p>
              <p className="mt-3 text-base text-surface-600 dark:text-surface-300">
                {work.empty.description}
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="overflow-hidden rounded-[2.5rem] border border-surface-200 bg-surface-950 px-6 py-10 text-white dark:border-surface-800 sm:px-10 lg:px-14 lg:py-14"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/[0.62]">
                  {work.cta.title}
                </p>
                <h2 className="text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  {work.cta.title} <span className="text-white/[0.72]">{work.cta.titleSpan}</span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/[0.76] sm:text-lg">
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
    ? `${caseStudy.client} • ${caseStudy.duration}`
    : caseStudy.client;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={themeStyle}
      className="group isolate flex h-full flex-col overflow-hidden rounded-[2rem] border border-surface-200 bg-white shadow-[0_26px_70px_-44px_rgba(15,23,42,0.3)] transition-transform duration-300 hover:-translate-y-1 dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="relative min-h-[18rem] overflow-hidden bg-surface-950 sm:min-h-[19rem]">
        <Image
          src={caseStudy.thumbnail || caseStudy.hero.image}
          alt={caseStudy.hero.alt}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
          sizes="(min-width: 1280px) 28vw, (min-width: 768px) 46vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.22)_48%,rgba(2,6,23,0.84)_100%)]" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'linear-gradient(180deg, rgba(var(--case-primary-rgb), 0.06), rgba(var(--case-primary-rgb), 0.24))',
          }}
        />
        <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md"
            style={{ backgroundColor: 'rgba(var(--case-primary-rgb), 0.22)' }}
          >
            {caseStudy.platform}
          </span>
          <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs font-medium text-white/82 backdrop-blur-md">
            {caseStudy.client}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="inline-flex rounded-full border border-white/12 bg-black/28 px-3 py-1 text-xs font-medium text-white/82 backdrop-blur-md">
            {caseStudy.industry}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="line-clamp-2 text-2xl font-semibold tracking-[-0.03em] text-surface-900 dark:text-white">
          {caseStudy.title}
        </h3>
        <p className="mt-2 text-sm font-medium text-surface-500 dark:text-surface-400">
          {metaLine}
        </p>
        <p className="mt-4 line-clamp-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
          {caseStudy.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-1 text-sm font-medium text-surface-900 dark:text-white"
            style={{ backgroundColor: 'rgba(var(--case-accent-rgb), 0.14)' }}
          >
            {getProjectProof(caseStudy)}
          </span>
        </div>
        <div className="mt-auto pt-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-white">
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
