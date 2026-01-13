'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDirection } from '@/lib/i18n-utils';
import { ArrowRight } from 'lucide-react';

export const CTABanner: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  return (
    <section className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-surface-100 dark:bg-surface-950">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/8 via-transparent to-accent-500/8 dark:from-primary-500/5 dark:to-accent-500/5"></div>
        <div className="absolute top-0 start-0 w-full h-full">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.08]"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 start-[15%] w-20 h-20 border-2 border-primary-500/20 rounded-xl"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          y: [0, -20, 0, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-20 end-[15%] w-16 h-16 border-2 border-accent-500/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 start-[5%] w-24 h-24 border border-primary-400/10 rounded-2xl"
        animate={{
          rotate: [0, -45, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 end-[8%] w-12 h-12 bg-accent-500/5 rounded-lg"
        animate={{
          y: [0, 30, 0],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient Glow Orbs - Enhanced */}
      <div className="absolute top-1/2 start-1/4 w-[500px] h-[500px] bg-primary-500/15 dark:bg-primary-500/20 rounded-full blur-[150px] animate-pulse"></div>
      <div
        className="absolute top-1/2 end-1/4 w-[400px] h-[400px] bg-accent-500/12 dark:bg-accent-500/15 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: '1s' }}
      ></div>

      {/* Main Content Card with Animated Border */}
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Animated gradient border wrapper */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-[2rem] opacity-75 blur-sm animate-gradient-x"></div>
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-[2rem] opacity-90 animate-gradient-x"></div>

          {/* Inner content */}
          <div className="relative rounded-xl md:rounded-[2rem] p-8 md:p-12 lg:p-14 bg-white dark:bg-surface-900 text-center overflow-hidden">
            {/* Inner decorative orb */}
            <div className="absolute top-0 start-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-b from-primary-500/10 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10 space-y-6 md:space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-surface-900 dark:text-white leading-[1.1] tracking-tight">
                {t('ctaBanner.titlePart1')}{' '}
                <span className="gradient-text text-glow-subtle">{t('ctaBanner.titlePart2')}</span>
              </h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-base md:text-lg lg:text-xl text-surface-600 dark:text-surface-300 font-light leading-relaxed max-w-2xl mx-auto"
              >
                {t('ctaBanner.description')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
                className="pt-2 md:pt-4"
              >
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg md:text-xl px-10 md:px-14 py-5 md:py-6 font-black shadow-glow-primary group w-full sm:w-auto"
                  >
                    <span className="flex items-center gap-3 justify-center">
                      {t('ctaBanner.button')}
                      <motion.div
                        animate={{ x: isRtl ? [0, -5, 0] : [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight
                          className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`}
                          strokeWidth={2.5}
                        />
                      </motion.div>
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
