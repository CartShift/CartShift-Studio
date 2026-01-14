'use client';

import React, { useState } from 'react';
import { motion } from '@/lib/motion';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageHero } from '@/components/sections/PageHero';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { CaseStudyMeta } from '@/lib/case-studies';

interface WorkPageContentProps {
  caseStudies?: CaseStudyMeta[];
}

export const WorkPageContent: React.FC<WorkPageContentProps> = ({ caseStudies = [] }) => {
  const t = useTranslations();
  const [activeFilter, setActiveFilter] = useState<'all' | 'shopify' | 'wordpress'>('all');

  const work = t.raw('work' as never) as {
    hero: { title: string; subtitle: string; description: string; badge: string };
    filters: { all: string; shopify: string; wordpress: string };
    cta: { title: string; titleSpan: string; description: string; button: string };
    viewProject: string;
  };

  const filteredCaseStudies =
    activeFilter === 'all'
      ? caseStudies
      : caseStudies.filter(cs => cs.platform.toLowerCase().includes(activeFilter));

  const filters: Array<{ key: 'all' | 'shopify' | 'wordpress'; label: string }> = [
    { key: 'all', label: work.filters.all },
    { key: 'shopify', label: work.filters.shopify },
    { key: 'wordpress', label: work.filters.wordpress },
  ];

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: work.hero.title, href: '/work' },
  ];

  const getPlatformType = (platform: string): 'shopify' | 'wordpress' => {
    return platform.toLowerCase().includes('shopify') ? 'shopify' : 'wordpress';
  };

  return (
    <>
      <PageHero
        title={work.hero.title}
        subtitle={work.hero.subtitle}
        description={work.hero.description}
        badge={work.hero.badge}
      />
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <div className="sticky top-16 md:top-20 z-30 bg-white/95 dark:bg-surface-800/95 backdrop-blur-lg border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2.5 min-h-[40px] rounded-lg text-sm font-medium transition-all touch-manipulation active:scale-95 shrink-0 ${
                  activeFilter === filter.key
                    ? 'bg-accent-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Section background="light" className="relative overflow-hidden">
        {filteredCaseStudies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCaseStudies.map((caseStudy, index) => {
              const platformType = getPlatformType(caseStudy.platform);
              const topResult = caseStudy.results[0];

              return (
                <motion.div
                  key={caseStudy.slug}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/work/${caseStudy.slug}`}>
                    <Card hover padding="none" className="h-full group relative overflow-hidden">
                      <div
                        className={`relative aspect-[4/3] overflow-hidden ${
                          platformType === 'shopify'
                            ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/20 dark:to-teal-950/30'
                            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30'
                        }`}
                      >
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-5"></div>

                        {/* Featured Result Badge */}
                        {topResult && (
                          <div className="absolute top-3 start-3 rtl:start-auto rtl:end-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm ${
                                platformType === 'shopify'
                                  ? 'bg-green-500/90 text-white'
                                  : 'bg-blue-500/90 text-white'
                              }`}
                            >
                              {topResult.improvement} {topResult.metric}
                            </span>
                          </div>
                        )}

                        {/* Platform Badge */}
                        <div className="absolute top-3 end-3 rtl:end-auto rtl:start-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${
                              platformType === 'shopify'
                                ? 'bg-green-500/90 text-white dark:bg-green-600/80'
                                : 'bg-blue-500/90 text-white dark:bg-blue-600/80'
                            }`}
                          >
                            {platformType}
                          </span>
                        </div>

                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className={`relative w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${
                              platformType === 'shopify'
                                ? 'bg-green-100/50 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/30'
                                : 'bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/30'
                            }`}
                          >
                            <Icon
                              name={platformType === 'shopify' ? 'shopping-cart' : 'globe'}
                              size={40}
                              className={`transition-transform duration-300 group-hover:scale-110 ${
                                platformType === 'shopify'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-3">
                          <span className="inline-block text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">
                            {caseStudy.industry}
                          </span>
                          <CardTitle className="text-xl font-bold mb-2 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-2">
                            {caseStudy.title}
                          </CardTitle>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            {caseStudy.client} • {caseStudy.duration}
                          </p>
                        </div>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-3 leading-relaxed">
                          {caseStudy.summary}
                        </p>

                        {/* Results Preview */}
                        {caseStudy.results.length > 1 && (
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                            {caseStudy.results.slice(0, 3).map((result, i) => (
                              <span
                                key={i}
                                className={`px-2 py-1 text-xs font-semibold rounded-md ${
                                  platformType === 'shopify'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}
                              >
                                {result.improvement}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                          <span>{work.viewProject}</span>
                          <Icon
                            name="arrow-right"
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180"
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <Icon name="search" size={32} className="text-surface-400" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              {(work as any).empty?.title || 'No Projects Found'}
            </h3>
            <p className="text-surface-500 dark:text-surface-400">
              {(work as any).empty?.description || 'Try changing the filter to see more projects.'}
            </p>
          </div>
        )}
      </Section>

      <Section background="default" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white font-display mb-8 leading-tight tracking-tight">
              {work.cta.title} <span className="gradient-text">{work.cta.titleSpan}</span>
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {work.cta.description}
            </p>
            <Link href="/contact">
              <Button size="lg" className="group">
                <span className="relative z-10 flex items-center gap-2">
                  {work.cta.button}
                  <svg
                    className="w-5 h-5 transition-transform rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </Section>
    </>
  );
};
