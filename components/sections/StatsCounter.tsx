'use client';

import React, { useRef } from 'react';
import { motion, useInView } from '@/lib/motion';
import { statCard, staggerContainer } from '@/lib/animation-variants';
import { useTranslations } from 'next-intl';
import { Briefcase, ThumbsUp, Award, Clock } from 'lucide-react';

import { Counter } from '@/components/ui/Counter';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
}

export const StatsCounter: React.FC = () => {
  const t = useTranslations();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stats: Stat[] = [
    {
      value: 50,
      suffix: '+',
      label: t('stats.projects.label'),
      icon: <Briefcase size={32} strokeWidth={1.5} />,
    },
    {
      value: 98,
      suffix: '%',
      label: t('stats.satisfaction.label'),
      icon: <ThumbsUp size={32} strokeWidth={1.5} />,
    },
    {
      value: 12,
      suffix: '+',
      label: t('stats.years.label'),
      icon: <Award size={32} strokeWidth={1.5} />,
    },
    {
      value: 24,
      suffix: '/7',
      label: t('stats.support.label'),
      icon: <Clock size={32} strokeWidth={1.5} />,
    },
  ];

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 overflow-hidden bg-background dark:bg-surface-950 transition-colors duration-500"
    >
      {/* Immersive Dark Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-background to-accent-900/10 dark:from-primary-900/20 dark:via-surface-950 dark:to-accent-900/20 pointer-events-none" />

      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="stats-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary-500"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#stats-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-display font-black text-surface-900 dark:text-white mb-6 tracking-tight">
            {t('stats.title')}
          </h2>
          <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto font-light">
            {t('stats.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={statCard} className="group">
              <div className="relative h-full p-8 lg:p-10 rounded-[2.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-surface-200/50 dark:border-white/10 transition-all duration-500 shadow-premium">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 transition-all duration-500">
                    {stat.icon}
                  </div>

                  <div className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-surface-900 dark:text-white mb-4 tracking-tighter">
                    <Counter
                      value={stat.value}
                      suffix={stat.suffix}
                      inView={isInView}
                      className="tabular-nums"
                    />
                  </div>

                  <div className="text-lg text-surface-500 dark:text-surface-400 font-medium uppercase tracking-widest text-sm">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
