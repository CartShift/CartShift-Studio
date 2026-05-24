'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { SectionHeader } from '@/components/ui/Section';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getDateLocaleString } from '@/lib/locale-config';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock, Calendar } from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readingTime?: number;
  translation?: {
    title: string;
    excerpt: string;
    category: string;
  };
}

interface BlogTeaserProps {
  posts?: BlogPost[];
}

export const BlogTeaser: React.FC<BlogTeaserProps> = ({ posts }) => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = locale === 'he';
  const latestPosts = t.raw('blogTeaser.posts') as any[];

  const displayPosts = posts
    ? posts.map(post => ({
        title: isHe && post.translation?.title ? post.translation.title : post.title,
        excerpt: isHe && post.translation?.excerpt ? post.translation.excerpt : post.excerpt,
        category: isHe && post.translation?.category ? post.translation.category : post.category,
        date: post.date,
        href: `/blog/${post.slug}`,
        readingTime: post.readingTime,
      }))
    : latestPosts;

  if (!displayPosts || displayPosts.length === 0) return null;

  const featuredPost = displayPosts[0];
  const secondaryPosts = displayPosts.slice(1);

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-background dark:bg-black transition-colors duration-500 overflow-hidden">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[200px] end-0 w-[600px] h-[600px] bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[200px] start-0 w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          title={t('blogTeaser.title')}
          subtitle={t('blogTeaser.subtitle')}
          className="mb-20"
        />

        {/* Featured Post */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <Link href={featuredPost.href} className="block group">
            <div className="relative rounded-[2.5rem] p-8 md:p-14 bg-white/60 dark:bg-surface-950/40 border border-surface-200/50 dark:border-white/10 backdrop-blur-xl transition-all duration-500 hover:shadow-premium overflow-hidden">
              <div className="absolute top-0 start-0 h-full w-2 bg-gradient-to-b from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-4 mb-8">
                  <span className="px-5 py-1.5 bg-accent-500 text-white text-xs font-black uppercase rounded-full shadow-lg">
                    {t('blogTeaser.new')}
                  </span>
                  <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 text-sm font-medium">
                    <Clock size={16} />
                    {featuredPost.readingTime
                      ? `${featuredPost.readingTime} ${t('blogPost.content.minRead')}`
                      : t('blogTeaser.readTime')}
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl md:text-5xl font-display font-black text-surface-900 dark:text-white leading-[1.1] mb-6 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-xl text-surface-600 dark:text-surface-300 leading-relaxed mb-10 font-light">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-surface-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3 text-surface-500 dark:text-surface-400 font-medium font-display">
                      <Calendar size={18} className="text-primary-500" />
                      {new Date(featuredPost.date).toLocaleDateString(getDateLocaleString(locale), {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-3 text-accent-600 dark:text-accent-400 font-black group-hover:gap-5 transition-all">
                      {t('blogTeaser.readMore')}
                      <ArrowRight size={24} className="rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Posts */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {secondaryPosts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={post.href} className="block h-full group">
                <div className="h-full p-8 rounded-3xl bg-white/60 dark:bg-surface-950/40 border border-surface-200/50 dark:border-white/5 backdrop-blur-xl transition-all duration-500 hover:bg-white dark:hover:bg-white/10 hover:shadow-premium hover:-translate-y-2">
                  <div className="flex items-center gap-3 mb-6 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                    <span>
                      {new Date(post.date).toLocaleDateString(getDateLocaleString(locale))}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    <span>
                      {post.readingTime
                        ? `${post.readingTime} ${t('blogPost.content.minRead')}`
                        : t('blogTeaser.readTime')}
                    </span>
                  </div>

                  <h4 className="text-2xl font-bold font-display text-surface-900 dark:text-white leading-tight mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed mb-8 font-light line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-accent-600 dark:text-accent-400 font-black group-hover:gap-5 transition-all">
                    {t('blogTeaser.readMore')}
                    <ArrowRight size={20} className="rtl:rotate-180" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <Link href="/blog">
            <Button
              variant="outline"
              size="lg"
              className="h-16 px-10 rounded-2xl font-black border-surface-300 dark:border-white/10 text-surface-900 dark:text-white hover:bg-white dark:hover:bg-white/10 group"
            >
              <span className="flex items-center gap-3">
                {t('blogTeaser.viewAll')}
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform rtl:rotate-180"
                />
              </span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
