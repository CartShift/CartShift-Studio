'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { SectionHeader } from '@/components/ui/Section';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getDateLocaleString } from '@/lib/locale-config';

export const BlogTeaser: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const latestPosts = t.raw('blogTeaser.posts') as any[];

  if (!latestPosts || latestPosts.length === 0) return null;

  const featuredPost = latestPosts[0];
  const secondaryPosts = latestPosts.slice(1);

  // Calculate approximate read time
  const getReadTime = () => t('blogTeaser.readTime');

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-surface-50 dark:bg-surface-900 overflow-hidden">
      <div className="absolute inset-y-0 start-1/2 -translate-x-1/2 w-screen max-w-[100vw] pointer-events-none">
        <div className="absolute -top-[250px] end-0 w-[500px] h-[500px] bg-gradient-to-bl from-accent-500/10 via-accent-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[200px] start-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary-500/10 via-primary-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-dropdown">
        <SectionHeader title={t('blogTeaser.title')} subtitle={t('blogTeaser.subtitle')} />

        {/* Featured Post - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-8"
        >
          <Link href={featuredPost.href}>
            <div className="group relative rounded-3xl p-8 md:p-12 bg-gradient-to-br from-surface-100 via-surface-50 to-white dark:from-surface-800 dark:via-surface-850 dark:to-surface-900 border border-surface-200/50 dark:border-surface-700/50 hover:border-accent-500/30 transition-all duration-300 hover:shadow-xl overflow-hidden">
              {/* NEW badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 end-6 px-3 py-1.5 bg-accent-500 text-white text-xs font-bold uppercase rounded-full shadow-lg"
              >
                {t('blogTeaser.new')}
              </motion.span>

              {/* Decorative accent line */}
              <div className="absolute top-0 start-0 h-full w-1.5 bg-gradient-to-b from-primary-500 via-accent-500 to-primary-500 rtl:rounded-e-3xl ltr:rounded-s-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                <div className="flex-1">
                  {/* Category tag */}
                  <div className="inline-flex items-center gap-2 mb-5">
                    <span className="px-4 py-1.5 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-sm font-semibold rounded-full">
                      {t('blogTeaser.featured')}
                    </span>
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      {getReadTime()}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-surface-900 dark:text-white leading-tight mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {featuredPost.title}
                  </h3>

                  <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed mb-6 max-w-2xl">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-surface-500 dark:text-surface-400">
                      {new Date(featuredPost.date).toLocaleDateString(getDateLocaleString(locale), {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 font-bold group-hover:gap-3 transition-all">
                      {t('blogTeaser.readMore')}
                      <svg
                        className="w-5 h-5 rtl:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Posts - Compact Grid */}
        {secondaryPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {secondaryPosts.map((post, index) => (
              <motion.div
                key={index + 1}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.15, type: 'spring' }}
              >
                <Link href={post.href}>
                  <div className="h-full glass-effect rounded-2xl p-6 group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-premium hover:shadow-premium-hover relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                        {new Date(post.date).toLocaleDateString(getDateLocaleString(locale))}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600"></span>
                      <span className="text-xs text-surface-500 dark:text-surface-400">
                        {getReadTime()}
                      </span>
                    </div>

                    <h4 className="text-lg md:text-xl font-display font-bold text-surface-900 dark:text-white leading-tight mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {post.title}
                    </h4>

                    <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 font-semibold text-sm group-hover:gap-3 transition-all">
                      {t('blogTeaser.readMore')}
                      <svg
                        className="w-4 h-4 rtl:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link href="/blog">
            <button className="px-8 py-4 rounded-xl border-2 border-surface-300 dark:border-white/10 bg-white dark:bg-white/5 text-surface-900 dark:text-white font-bold transition-all hover:bg-surface-50 dark:hover:bg-white/10 hover:border-accent-500/50 backdrop-blur-md shadow-premium hover:shadow-premium-hover flex items-center gap-3 mx-auto group">
              {t('blogTeaser.viewAll')}
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
