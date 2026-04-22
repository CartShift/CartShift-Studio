'use client';

import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Globe,
  Layers3,
  Quote,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { motion, useScroll, useTransform } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CaseStudyGallery } from '@/components/sections/case-study/CaseStudyGallery';
import { Link } from '@/i18n/navigation';
import { isRTLLocale } from '@/lib/locale-config';
import { getCaseStudyThemeStyle } from '@/lib/case-study-theme';
import type { CaseStudy } from '@/lib/case-studies';

type WorkDetailTranslations = {
  hero: { title: string; subtitle: string; description: string; badge: string };
  cta: { title: string; titleSpan: string; description: string; button: string };
  viewProject: string;
  detail: {
    client: string;
    industry: string;
    platform: string;
    duration: string;
    services: string;
    startProject: string;
    wantResults: string;
    wantResultsDesc: string;
    getConsultation: string;
    viewMore: string;
    projectOverview: string;
    whatWeShipped: string;
    selectedScreens: string;
    evidenceTitle: string;
    clientQuote: string;
    projectNotes: string;
    visitSite: string;
    galleryHint: string;
    openImage: string;
    previousScreen: string;
    nextScreen: string;
  };
};

interface CaseStudyDetailContentProps {
  caseStudy: CaseStudy;
}

const sectionReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-120px' },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const;

export const CaseStudyDetailContent: React.FC<CaseStudyDetailContentProps> = ({ caseStudy }) => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = isRTLLocale(locale);
  const themeStyle = getCaseStudyThemeStyle(caseStudy.brand);
  const heroRef = React.useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], [0, 72]);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.06]);
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 28]);
  const heroPanelY = useTransform(heroProgress, [0, 1], [0, -24]);
  const heroGlowOpacity = useTransform(heroProgress, [0, 1], [1, 0.55]);
  const heroStoryOpacity = useTransform(heroProgress, [0, 0.2, 0.68], [0, 0.2, 0.58]);
  const heroStoryY = useTransform(heroProgress, [0, 1], [42, -28]);
  const heroStoryRotate = useTransform(heroProgress, [0, 1], [-6, -2]);

  const workT = t.raw('work' as any) as WorkDetailTranslations;

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: workT.hero.title, href: '/work' },
    { label: caseStudy.title, href: `/work/${caseStudy.slug}` },
  ];

  const galleryItems =
    caseStudy.gallery.length > 0
      ? caseStudy.gallery
      : [
          {
            image: caseStudy.hero.image,
            alt: caseStudy.hero.alt,
            caption: caseStudy.hero.supportingCopy || caseStudy.summary,
          },
        ];
  const heroStoryFrame =
    galleryItems.find(item => item.image && item.image !== caseStudy.hero.image) || null;
  const projectMeta = [
    { label: workT.detail.client, value: caseStudy.client },
    { label: workT.detail.industry, value: caseStudy.industry },
    { label: workT.detail.platform, value: caseStudy.platform },
    {
      label: workT.detail.duration,
      value: caseStudy.duration,
    },
  ].filter(item => item.value);

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      style={themeStyle}
      className="bg-surface-50 text-surface-900 transition-colors dark:bg-black dark:text-white"
    >
      <section
        ref={heroRef}
        className="relative isolate overflow-hidden min-h-screen min-h-[100svh] bg-[#eef4fb] text-surface-950 dark:bg-surface-950 dark:text-white"
      >
        {caseStudy.hero.image && (
          <motion.div className="absolute inset-0" style={{ y: heroImageY, scale: heroImageScale }}>
            <Image
              src={caseStudy.hero.image}
              alt={caseStudy.hero.alt}
              fill
              priority
              className="object-cover object-top"
              sizes="100vw"
            />
          </motion.div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.38)_0%,rgba(241,245,249,0.62)_42%,rgba(226,232,240,0.92)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.8)_48%,rgba(2,6,23,0.96)_100%)]" />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 16% 18%, rgba(var(--case-primary-rgb), 0.22), transparent 34%), radial-gradient(circle at 82% 12%, rgba(var(--case-accent-rgb), 0.14), transparent 28%)',
            opacity: heroGlowOpacity,
          }}
        />
        {heroStoryFrame && (
          <motion.div
            className="pointer-events-none absolute bottom-10 end-6 hidden w-[min(28rem,34vw)] overflow-hidden rounded-[2rem] border border-surface-200/80 bg-white/72 shadow-[0_28px_100px_rgba(148,163,184,0.28)] backdrop-blur-md xl:block dark:border-white/12 dark:bg-surface-950/40 dark:shadow-[0_28px_100px_rgba(2,6,23,0.45)]"
            style={{
              opacity: heroStoryOpacity,
              y: heroStoryY,
              rotate: heroStoryRotate,
            }}
          >
            <div className="relative aspect-[4/5]">
              <Image
                src={heroStoryFrame.image}
                alt={heroStoryFrame.alt}
                fill
                className="object-cover object-top"
                sizes="(min-width: 1280px) 28vw, 0px"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_22%,rgba(255,255,255,0.82)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0)_22%,rgba(2,6,23,0.78)_100%)]" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-white/58">
                {workT.detail.selectedScreens}
              </p>
              <p className="mt-3 text-base font-semibold leading-snug text-surface-950 dark:text-white">
                {heroStoryFrame.caption}
              </p>
            </div>
          </motion.div>
        )}

        <div className="relative mx-auto flex min-h-screen min-h-[100svh] max-w-7xl flex-col px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="mb-10">
            <div className="inline-flex rounded-full border border-surface-200/80 bg-white/78 px-4 py-2 backdrop-blur-xl dark:border-white/15 dark:bg-black/20">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>

          <div className="mt-auto grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-3xl"
              style={{ y: heroCopyY }}
            >
              <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-surface-200/80 bg-white/78 px-4 py-2 font-semibold text-surface-950 backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.08] dark:text-white"
                  style={{
                    boxShadow: '0 0 0 1px rgba(var(--case-border-rgb), 0.18) inset',
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  {caseStudy.platform}
                </span>
                {caseStudy.siteUrl && (
                  <a
                    href={caseStudy.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-surface-200/80 bg-white/78 px-4 py-2 font-medium text-surface-900 transition-colors hover:bg-white dark:border-white/12 dark:bg-black/[0.15] dark:text-white/[0.84] dark:hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {workT.detail.visitSite}
                  </a>
                )}
              </div>

              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-surface-500 dark:text-white/60">
                {caseStudy.client}
              </p>
              <h1 className="max-w-4xl text-4xl font-bold leading-[0.92] tracking-[-0.04em] text-surface-950 sm:text-5xl lg:text-7xl dark:text-white">
                {caseStudy.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-surface-700 sm:text-lg lg:text-xl dark:text-white/[0.76]">
                {caseStudy.hero.supportingCopy || caseStudy.summary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
                    className="group"
                  >
                    {workT.detail.startProject}
                  </Button>
                </Link>
                <Link href="/work">
                  <Button variant="glass" size="lg">
                    {workT.detail.viewMore}
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: isHe ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="rounded-[2rem] border border-surface-200/80 bg-white/72 p-6 shadow-[0_24px_90px_rgba(148,163,184,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:shadow-2xl lg:p-8"
              style={{
                y: heroPanelY,
                boxShadow:
                  '0 24px 90px rgba(148, 163, 184, 0.22), inset 0 1px 0 rgba(255,255,255,0.56)',
              }}
            >
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.26em] text-surface-500 dark:text-white/[0.55]">
                {workT.detail.projectOverview}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {projectMeta.map(item => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-surface-200/80 bg-white/84 p-4 dark:border-white/8 dark:bg-surface-950/40"
                  >
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-surface-500 dark:text-white/45">
                      {item.label}
                    </p>
                    <p className="text-base font-semibold text-surface-950 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {caseStudy.services.length > 0 && (
                <div className="mt-6 border-t border-surface-200/80 pt-6 dark:border-white/10">
                  <p className="mb-4 text-xs uppercase tracking-[0.24em] text-surface-500 dark:text-white/45">
                    {workT.detail.services}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {caseStudy.services.map(service => (
                      <span
                        key={service}
                        className="rounded-full border border-surface-200/80 bg-white/84 px-3 py-1.5 text-sm text-surface-900 dark:border-white/10 dark:bg-white/[0.07] dark:text-white/[0.84]"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 dark:bg-surface-950 md:py-24">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ backgroundColor: 'rgba(var(--case-border-rgb), 0.42)' }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...sectionReveal}
            className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
          >
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-surface-400">
                {workT.detail.projectOverview}
              </p>
              <h2 className="max-w-2xl text-3xl font-bold tracking-[-0.03em] text-surface-900 dark:text-white sm:text-4xl">
                {caseStudy.overview.title}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">
                {caseStudy.overview.summary}
              </p>
            </div>

            <div
              className="rounded-[2rem] border bg-[rgba(var(--case-surface-rgb),0.42)] p-6 dark:border-[rgba(var(--case-dark-border-rgb),0.64)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.78)]"
              style={{
                borderColor: 'rgba(var(--case-border-rgb), 0.4)',
              }}
            >
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 rounded-full p-2"
                    style={{ backgroundColor: 'rgba(var(--case-primary-rgb), 0.12)' }}
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {caseStudy.client}
                    </p>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {caseStudy.industry}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 rounded-full p-2"
                    style={{ backgroundColor: 'rgba(var(--case-accent-rgb), 0.14)' }}
                  >
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {caseStudy.platform}
                    </p>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {caseStudy.siteUrl || caseStudy.platform}
                    </p>
                  </div>
                </div>
                {caseStudy.duration && (
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 rounded-full p-2"
                      style={{ backgroundColor: 'rgba(var(--case-primary-rgb), 0.12)' }}
                    >
                      <TimerReset className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">
                        {caseStudy.duration}
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        {caseStudy.hero.supportingCopy || caseStudy.summary}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {caseStudy.deliverables.length > 0 && (
        <section className="relative overflow-hidden py-16 dark:bg-black md:py-24">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(var(--case-primary-rgb), 0.045), rgba(255,255,255,0))',
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal}>
              <div className="mb-10 flex items-end justify-between gap-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-surface-400">
                    {workT.detail.whatWeShipped}
                  </p>
                  <h2 className="text-3xl font-bold tracking-[-0.03em] text-surface-900 dark:text-white sm:text-4xl">
                    {workT.detail.whatWeShipped}
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {caseStudy.deliverables.map(deliverable => (
                  <article
                    key={deliverable.title}
                    className="rounded-[1.75rem] border bg-white/[0.92] p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-[rgba(var(--case-dark-border-rgb),0.64)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.84)]"
                    style={{
                      borderColor: 'rgba(var(--case-border-rgb), 0.34)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="mt-0.5 rounded-2xl p-3"
                        style={{ backgroundColor: 'rgba(var(--case-primary-rgb), 0.12)' }}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                          {deliverable.title}
                        </h3>
                        <p className="mt-2 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                          {deliverable.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {galleryItems.length > 0 && (
        <CaseStudyGallery
          galleryItems={galleryItems}
          caseStudySlug={caseStudy.slug}
          isHe={isHe}
          translations={{
            selectedScreens: workT.detail.selectedScreens,
            galleryHint: workT.detail.galleryHint,
            previousScreen: workT.detail.previousScreen,
            nextScreen: workT.detail.nextScreen,
            openImage: workT.detail.openImage,
          }}
        />
      )}

      {caseStudy.evidence.length > 0 && (
        <section className="py-16 dark:bg-black md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal}>
              <div className="mb-10 max-w-3xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-surface-400">
                  {workT.detail.evidenceTitle}
                </p>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-surface-900 dark:text-white sm:text-4xl">
                  {workT.detail.evidenceTitle}
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {caseStudy.evidence.map(item => (
                  <article
                    key={`${item.title}-${item.value || item.description}`}
                    className="rounded-[1.75rem] border bg-[rgba(var(--case-surface-rgb),0.26)] p-6 dark:border-[rgba(var(--case-dark-border-rgb),0.64)] dark:bg-[rgba(var(--case-dark-surface-rgb),0.82)]"
                    style={{
                      borderColor: 'rgba(var(--case-border-rgb), 0.42)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="max-w-lg">
                        <p className="text-lg font-semibold text-surface-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                          {item.description}
                        </p>
                        {(item.before || item.after) && (
                          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                            {item.before && (
                              <span className="rounded-full border border-surface-300/70 px-3 py-1 dark:border-surface-700">
                                {item.before}
                              </span>
                            )}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                            {item.after && (
                              <span
                                className="rounded-full px-3 py-1 font-medium text-surface-900 dark:text-white"
                                style={{ backgroundColor: 'rgba(var(--case-primary-rgb), 0.12)' }}
                              >
                                {item.after}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {item.value && (
                        <div
                          className="shrink-0 rounded-[1.35rem] px-4 py-3 text-sm font-semibold text-surface-900 dark:text-white"
                          style={{ backgroundColor: 'rgba(var(--case-accent-rgb), 0.18)' }}
                        >
                          {item.value}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {caseStudy.testimonial && (
        <section className="bg-white py-16 dark:bg-surface-950 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              {...sectionReveal}
              className="relative overflow-hidden rounded-[2.5rem] border px-6 py-10 dark:border-[rgba(var(--case-dark-border-rgb),0.62)] sm:px-10 lg:px-14 lg:py-16"
              style={{
                background:
                  'linear-gradient(135deg, rgba(var(--case-primary-rgb), 0.16), rgba(var(--case-accent-rgb), 0.1))',
                borderColor: 'rgba(var(--case-border-rgb), 0.36)',
              }}
            >
              <div className="absolute start-6 top-6 opacity-30">
                <Quote className="h-10 w-10" />
              </div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-surface-600 dark:text-surface-300">
                {workT.detail.clientQuote}
              </p>
              <blockquote className="max-w-4xl text-2xl font-semibold leading-[1.35] tracking-[-0.02em] text-surface-900 dark:text-white sm:text-3xl">
                “{caseStudy.testimonial.quote}”
              </blockquote>
              <div className="mt-8">
                <p className="text-base font-semibold text-surface-900 dark:text-white">
                  {caseStudy.testimonial.author}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-300">
                  {caseStudy.testimonial.role}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {caseStudy.content.trim() && (
        <section className="pb-16 dark:bg-black md:pb-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal}>
              <div className="mb-8 flex items-center gap-3">
                <div
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: 'rgba(var(--case-primary-rgb), 0.12)' }}
                >
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-surface-500 dark:text-surface-400">
                    {workT.detail.projectNotes}
                  </p>
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-surface-900 dark:text-white">
                    {workT.detail.projectNotes}
                  </h2>
                </div>
              </div>
              <div className="prose-article">
                <ReactMarkdown>{caseStudy.content}</ReactMarkdown>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...sectionReveal}
            className="overflow-hidden rounded-[2.5rem] border px-6 py-10 text-white dark:border-[rgba(var(--case-dark-border-rgb),0.7)] sm:px-10 lg:px-14 lg:py-14"
            style={{
              background:
                'linear-gradient(135deg, rgba(var(--case-primary-rgb), 0.96), rgba(var(--case-accent-rgb), 0.76))',
              borderColor: 'rgba(var(--case-border-rgb), 0.5)',
            }}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/[0.72]">
                  {workT.cta.title}
                </p>
                <h2 className="text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
                  {workT.detail.wantResults}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
                  {workT.detail.wantResultsDesc}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href="/contact">
                  <Button
                    variant="secondary"
                    size="lg"
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                    className="bg-white text-surface-900 hover:bg-surface-100"
                  >
                    {workT.detail.getConsultation}
                  </Button>
                </Link>
                <Link href="/work">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/40 text-white hover:bg-white/10"
                  >
                    {workT.detail.viewMore}
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
