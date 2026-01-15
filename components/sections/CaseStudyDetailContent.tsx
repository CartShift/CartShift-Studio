'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageHero } from '@/components/sections/PageHero';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { CaseStudy } from '@/lib/case-studies';
import { isRTLLocale } from '@/lib/locale-config';
import ReactMarkdown, { Components } from 'react-markdown';
import { CheckCircle2, Lightbulb, Target, TrendingUp, Zap, Users, BarChart3 } from 'lucide-react';

interface CaseStudyDetailContentProps {
  caseStudy: CaseStudy;
}

export const CaseStudyDetailContent: React.FC<CaseStudyDetailContentProps> = ({ caseStudy }) => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = isRTLLocale(locale);

  // Get translations with type safety workaround
  const workT = t.raw('work' as never) as {
    hero: { title: string };
    detail: {
      projectDetails: string;
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
    };
  };

  const breadcrumbItems = [
    { label: t('nav.home'), href: '/' },
    { label: workT.hero.title, href: '/work' },
    { label: caseStudy.title, href: `/work/${caseStudy.slug}` },
  ];

  const platformColor = caseStudy.platform.toLowerCase().includes('shopify') ? 'green' : 'blue';

  // Custom heading icon mapping based on content
  const getHeadingIcon = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('challenge')) return <Target className="w-6 h-6" />;
    if (lowerText.includes('approach') || lowerText.includes('solution'))
      return <Lightbulb className="w-6 h-6" />;
    if (lowerText.includes('result')) return <TrendingUp className="w-6 h-6" />;
    if (lowerText.includes('takeaway') || lowerText.includes('key'))
      return <Zap className="w-6 h-6" />;
    if (lowerText.includes('phase') || lowerText.includes('step'))
      return <CheckCircle2 className="w-5 h-5" />;
    if (lowerText.includes('team') || lowerText.includes('customer'))
      return <Users className="w-5 h-5" />;
    if (
      lowerText.includes('metric') ||
      lowerText.includes('traffic') ||
      lowerText.includes('growth')
    )
      return <BarChart3 className="w-5 h-5" />;
    return null;
  };

  // Custom markdown components for enhanced styling
  const markdownComponents: Components = {
    h2: ({ children }) => {
      const text = String(children);
      const icon = getHeadingIcon(text);
      return (
        <motion.div
          initial={{ opacity: 0, x: isHe ? 10 : -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mt-12 mb-6 group"
        >
          {icon && (
            <div
              className={`p-2.5 rounded-xl ${
                platformColor === 'green'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {icon}
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white font-display tracking-tight">
            {children}
          </h2>
        </motion.div>
      );
    },
    h3: ({ children }) => {
      const text = String(children);
      const icon = getHeadingIcon(text);
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2.5 mt-8 mb-4"
        >
          {icon && (
            <div
              className={`p-1.5 rounded-lg ${
                platformColor === 'green'
                  ? 'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
              }`}
            >
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-surface-800 dark:text-surface-100 font-display">
            {children}
          </h3>
        </motion.div>
      );
    },
    p: ({ children }) => (
      <p className="text-base md:text-lg text-surface-600 dark:text-surface-400 leading-relaxed mb-5">
        {children}
      </p>
    ),
    ul: ({ children }) => <ul className="space-y-3 my-6 ms-1">{children}</ul>,
    li: ({ children }) => (
      <motion.li
        initial={{ opacity: 0, x: isHe ? 10 : -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-3 text-surface-600 dark:text-surface-400"
      >
        <span
          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
            platformColor === 'green'
              ? 'bg-green-500 dark:bg-green-400'
              : 'bg-blue-500 dark:bg-blue-400'
          }`}
        />
        <span className="leading-relaxed">{children}</span>
      </motion.li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-surface-900 dark:text-white">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <motion.blockquote
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className={`my-8 p-6 rounded-2xl border-s-4 ${
          platformColor === 'green'
            ? 'bg-green-50 border-green-400 dark:bg-green-950/30 dark:border-green-500'
            : 'bg-blue-50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-500'
        }`}
      >
        <div className="italic text-surface-700 dark:text-surface-300">{children}</div>
      </motion.blockquote>
    ),
    hr: () => (
      <div className="my-10 flex items-center justify-center gap-2">
        <div
          className={`h-1 w-1 rounded-full ${platformColor === 'green' ? 'bg-green-400' : 'bg-blue-400'}`}
        />
        <div
          className={`h-1.5 w-1.5 rounded-full ${platformColor === 'green' ? 'bg-green-500' : 'bg-blue-500'}`}
        />
        <div
          className={`h-1 w-1 rounded-full ${platformColor === 'green' ? 'bg-green-400' : 'bg-blue-400'}`}
        />
      </div>
    ),
    code: ({ children, className }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="px-1.5 py-0.5 text-sm bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded font-mono">
            {children}
          </code>
        );
      }
      return <code className={className}>{children}</code>;
    },
    pre: ({ children }) => (
      <pre className="my-6 p-4 bg-surface-900 dark:bg-surface-950 rounded-xl overflow-x-auto text-sm">
        {children}
      </pre>
    ),
  };

  return (
    <>
      <PageHero
        title={caseStudy.title}
        subtitle={caseStudy.client}
        description={caseStudy.summary}
        badge={caseStudy.platform}
      />

      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Results Summary */}
      <Section background="default" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute top-0 ${isHe ? 'left-0' : 'right-0'} w-96 h-96 rounded-full opacity-[0.03] blur-3xl ${
              platformColor === 'green' ? 'bg-green-500' : 'bg-blue-500'
            }`}
          />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {caseStudy.results.map((result, index) => (
              <motion.div
                key={result.metric}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative text-center p-5 md:p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    platformColor === 'green'
                      ? 'bg-gradient-to-br from-green-500/5 to-transparent'
                      : 'bg-gradient-to-br from-blue-500/5 to-transparent'
                  }`}
                />

                <div
                  className={`relative text-3xl md:text-4xl font-bold mb-2 ${
                    platformColor === 'green'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {result.improvement}
                </div>
                <div className="relative text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  {result.metric}
                </div>
                <div className="relative flex items-center justify-center gap-2 text-xs text-surface-400 dark:text-surface-500">
                  <span className="line-through opacity-60">{result.before}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  <span className="font-medium text-surface-600 dark:text-surface-300">
                    {result.after}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* Project Details */}
      <Section background="light" className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: isHe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Project Info Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 sticky top-24">
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 font-display">
                  {workT.detail.projectDetails}
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
                      {workT.detail.client}
                    </div>
                    <div className="font-medium text-surface-900 dark:text-white">
                      {caseStudy.client}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
                      {workT.detail.industry}
                    </div>
                    <div className="font-medium text-surface-900 dark:text-white">
                      {caseStudy.industry}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
                      {workT.detail.platform}
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        platformColor === 'green'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      <Icon
                        name={platformColor === 'green' ? 'shopping-cart' : 'globe'}
                        size={16}
                      />
                      {caseStudy.platform}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
                      {workT.detail.duration}
                    </div>
                    <div className="font-medium text-surface-900 dark:text-white">
                      {caseStudy.duration}
                    </div>
                  </div>
                </div>

                {/* Services */}
                {caseStudy.services && caseStudy.services.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-3">
                      {workT.detail.services}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.services.map(service => (
                        <span
                          key={service}
                          className="px-2.5 py-1 text-xs font-medium bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 rounded-lg"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                  <Link href="/contact">
                    <Button className="w-full">{workT.detail.startProject}</Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: isHe ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              {/* Testimonial */}
              {caseStudy.testimonial && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className={`mb-10 p-6 md:p-8 rounded-2xl border-s-4 relative overflow-hidden ${
                    platformColor === 'green'
                      ? 'bg-gradient-to-br from-green-50 to-green-50/50 border-green-500 dark:from-green-950/30 dark:to-green-950/10'
                      : 'bg-gradient-to-br from-blue-50 to-blue-50/50 border-blue-500 dark:from-blue-950/30 dark:to-blue-950/10'
                  }`}
                >
                  {/* Quote mark decoration */}
                  <div
                    className={`absolute top-4 ${isHe ? 'left-4' : 'right-4'} text-6xl font-serif opacity-10 ${
                      platformColor === 'green' ? 'text-green-500' : 'text-blue-500'
                    }`}
                  >
                    &ldquo;
                  </div>

                  <blockquote className="relative text-lg md:text-xl italic text-surface-700 dark:text-surface-300 mb-6 leading-relaxed">
                    &ldquo;{caseStudy.testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="relative flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg ${
                        platformColor === 'green'
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}
                    >
                      {caseStudy.testimonial.author[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900 dark:text-white text-lg">
                        {caseStudy.testimonial.author}
                      </div>
                      <div className="text-sm text-surface-500 dark:text-surface-400">
                        {caseStudy.testimonial.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Markdown Content */}
              <div className="relative">
                {/* Decorative element */}
                <div
                  className={`absolute -top-4 ${isHe ? '-right-4' : '-left-4'} w-24 h-24 rounded-full opacity-5 blur-2xl ${
                    platformColor === 'green' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                />

                <ReactMarkdown components={markdownComponents}>{caseStudy.content}</ReactMarkdown>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section background="default" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white font-display mb-6 leading-tight tracking-tight">
              {workT.detail.wantResults}
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {workT.detail.wantResultsDesc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="group">
                  <span className="relative z-dropdown flex items-center gap-2">
                    {workT.detail.getConsultation}
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
              <Link href="/work">
                <Button variant="outline" size="lg">
                  {workT.detail.viewMore}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  );
};
