'use client';

import React, { useRef } from 'react';
import { motion } from '@/lib/motion';
import { Section } from '@/components/ui/Section';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Code, ShoppingBag, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { useDirection } from '@/lib/i18n-utils';
import { cn } from '@/lib/utils';

const IntroBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.05, 0.1, 0.05],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    className={cn(
      'absolute rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-20',
      className
    )}
  />
);

export const HomepageIntro: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';
  const introData = t.raw('hero.intro' as never) as { title: string; paragraphs: string[] };
  const containerRef = useRef<HTMLDivElement>(null);

  if (
    !introData ||
    typeof introData !== 'object' ||
    !introData.title ||
    !Array.isArray(introData.paragraphs)
  ) {
    return null;
  }

  return (
    <Section className="relative overflow-visible pt-10 pb-24 md:pt-14 md:pb-32 bg-background dark:bg-surface-950 transition-colors duration-500">
      {/* Immersive Background */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-surface-100/50 dark:from-surface-900/10 to-transparent pointer-events-none" />

      <IntroBlob className="top-1/4 -start-20 w-[600px] h-[600px] bg-primary-500/15 dark:bg-primary-500/10" />
      <IntroBlob
        className="bottom-1/4 -end-20 w-[500px] h-[500px] bg-accent-500/15 dark:bg-accent-600/10"
        delay={2}
      />

      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10" ref={containerRef}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 mb-10 bg-white/80 dark:bg-white/5 rounded-full shadow-premium border border-surface-200/50 dark:border-white/10 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-xs font-bold text-surface-600 dark:text-surface-200 uppercase tracking-widest">
                {t('hero.intro.mission')}
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-7xl font-display font-black text-surface-900 dark:text-white mb-10 leading-[1.05] tracking-tight"
            >
              {introData.title.split(' ').slice(0, -1).join(' ')}
              <span className="block mt-4 gradient-text">
                {introData.title.split(' ').slice(-1)}
              </span>
            </motion.h2>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 w-[120px] bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full opacity-80"
            />
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
            <div className="md:col-span-12 lg:col-span-10 lg:col-start-2">
              <div className="space-y-12 relative">
                {/* Vertical line decoration */}
                <div className="absolute start-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary-500/60 via-primary-500/20 to-transparent -ms-8 lg:-ms-16 hidden md:block rounded-full" />

                {introData.paragraphs.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    className={cn(
                      'leading-relaxed font-light transition-colors duration-500',
                      index === 0
                        ? 'text-2xl md:text-4xl font-display font-medium text-surface-900 dark:text-white'
                        : 'text-xl md:text-2xl text-surface-600 dark:text-surface-300'
                    )}
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
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 pt-16 border-t border-surface-200/50 dark:border-white/10"
          >
            {[
              {
                icon: ShoppingBag,
                label: t('hero.intro.features.shopify.label'),
                desc: t('hero.intro.features.shopify.desc'),
                color: 'primary',
              },
              {
                icon: Code,
                label: t('hero.intro.features.technical.label'),
                desc: t('hero.intro.features.technical.desc'),
                color: 'accent',
              },
              {
                icon: TrendingUp,
                label: t('hero.intro.features.conversion.label'),
                desc: t('hero.intro.features.conversion.desc'),
                color: 'green',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group flex flex-col items-start gap-6 p-8 rounded-[2.5rem] bg-white/50 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-premium transition-all duration-500"
              >
                <div
                  className={cn(
                    'p-4 rounded-2xl transition-all duration-500',
                    item.color === 'primary'
                      ? 'bg-primary-500/10 text-primary-600 group-hover:bg-primary-500 group-hover:text-white'
                      : item.color === 'accent'
                        ? 'bg-accent-500/10 text-accent-600 group-hover:bg-accent-500 group-hover:text-white'
                        : 'bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white'
                  )}
                >
                  <item.icon size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display text-surface-900 dark:text-white mb-3">
                    {item.label}
                  </h3>
                  <p className="text-lg text-surface-500 dark:text-surface-400 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-14 flex flex-col items-center gap-4 text-center"
          >
            <p className="max-w-3xl text-lg text-surface-600 dark:text-surface-300">
              {isRtl
                ? 'מחפשים שותף לשיפור Shopify SEO, מהירות או המרות? התחילו בעמוד השירות שלנו, בדקו את החנות עם כלי האודיט, או קפצו ישר למדריך ה-Shopify SEO.'
                : 'Looking for help with Shopify SEO, speed, or conversion work? Start with our Shopify service page, run the store analyzer, or dive into the Shopify SEO pillar guide.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/solutions/shopify">
                <Button size="lg">
                  <span className="flex items-center gap-2">
                    {isRtl ? 'שירותי Shopify ו-SEO' : 'Explore Shopify services'}
                    <ArrowRight size={18} className="rtl:rotate-180" />
                  </span>
                </Button>
              </Link>
              <Link href="/tools/store-analyzer">
                <Button variant="outline" size="lg">
                  <span className="flex items-center gap-2">
                    {isRtl ? 'אודיט חינם לחנות' : 'Run a free store audit'}
                    <ArrowRight size={18} className="rtl:rotate-180" />
                  </span>
                </Button>
              </Link>
              <Link href="/blog/shopify-seo-complete-guide">
                <Button variant="ghost" size="lg">
                  <span className="flex items-center gap-2">
                    {isRtl ? 'מדריך Shopify SEO' : 'Read the SEO guide'}
                    <ArrowRight size={18} className="rtl:rotate-180" />
                  </span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
};
