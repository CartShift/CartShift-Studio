'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from '@/lib/motion';
import { Section } from '@/components/ui/Section';
import { useTranslations } from 'next-intl';
import { Code, ShoppingBag, TrendingUp, Sparkles } from 'lucide-react';
import { useDirection } from '@/lib/i18n-utils';

export const HomepageIntro: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';
  const introData = t.raw('hero.intro' as any) as { title: string; paragraphs: string[] };
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  if (
    !introData ||
    typeof introData !== 'object' ||
    !introData.title ||
    !Array.isArray(introData.paragraphs)
  ) {
    return null;
  }

  return (
    <Section className="relative overflow-hidden py-24 md:py-32 bg-surface-50 dark:bg-surface-950/20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 end-0 p-20 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
        <motion.div style={{ y, rotate }} className="relative">
          <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full w-[30rem] h-[30rem]" />
        </motion.div>
      </div>

      <div className="absolute bottom-0 start-0 p-20 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
          className="relative"
        >
          <div className="absolute inset-0 bg-accent-500/20 blur-[100px] rounded-full w-[25rem] h-[25rem]" />
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-dropdown" ref={containerRef}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 justify-center px-4 py-2 mb-8 bg-white dark:bg-surface-800 rounded-full shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wider">
                {t('hero.intro.mission')}
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-surface-900 dark:text-white mb-8 leading-[1.1] tracking-tight"
            >
              <span className="relative inline-block">
                {introData.title.split(' ').slice(0, -1).join(' ')}
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-400 dark:via-primary-300 dark:to-accent-400 rtl:bg-gradient-to-l">
                  {introData.title.split(' ').slice(-1)}
                </span>
              </span>
            </motion.h2>

            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100px' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1 bg-gradient-to-r from-primary-500 to-accent-500 rtl:bg-gradient-to-l mx-auto rounded-full opacity-80"
            />
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
            <div className="md:col-span-12 lg:col-span-8 lg:col-start-3">
              <div className="space-y-10 relative">
                {/* Vertical line decoration - Logical properties for RTL support */}
                <div className="absolute start-0 top-4 bottom-4 w-px bg-gradient-to-b from-primary-500/50 via-surface-300/50 to-transparent -ms-8 lg:-ms-12 hidden md:block" />

                {introData.paragraphs.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className={`leading-relaxed ${
                      index === 0
                        ? 'text-xl md:text-2xl font-medium text-surface-800 dark:text-surface-100'
                        : 'text-lg text-surface-600 dark:text-surface-300'
                    }`}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Features Strip */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 pt-12 border-t border-surface-200 dark:border-white/5"
          >
            {[
              {
                icon: ShoppingBag,
                label: t('hero.intro.features.shopify.label'),
                desc: t('hero.intro.features.shopify.desc'),
              },
              {
                icon: Code,
                label: t('hero.intro.features.technical.label'),
                desc: t('hero.intro.features.technical.desc'),
              },
              {
                icon: TrendingUp,
                label: t('hero.intro.features.conversion.label'),
                desc: t('hero.intro.features.conversion.desc'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group flex flex-col items-start gap-4 p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-surface-200/60 dark:border-white/5 hover:border-primary-200 dark:hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-none transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white group-hover:scale-110 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-300">
                  <item.icon size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                    {item.label}
                  </h4>
                  <p className="text-base text-surface-500 dark:text-surface-400 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
};
