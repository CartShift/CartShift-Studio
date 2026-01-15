'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useMotionValueEvent } from '@/lib/motion';
import { ParallaxLayer } from '@/components/ui/Parallax';
import { statCard, staggerContainer } from '@/lib/animation-variants';
import { useTranslations } from 'next-intl';
import { Briefcase, ThumbsUp, Award, Clock } from 'lucide-react';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
}

const AnimatedCounter: React.FC<{ value: number; suffix: string; inView: boolean }> = ({
  value,
  suffix,
  inView,
}) => {
  const motionValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    mass: 1,
  });
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(motionValue, 'change', latest => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  return (
    <span className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
};

export const StatsCounter: React.FC = () => {
  const t = useTranslations();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const stats: Stat[] = [
    {
      value: 50,
      suffix: '+',
      label: t('stats.projects.label'),
      icon: <Briefcase className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />,
    },
    {
      value: 98,
      suffix: '%',
      label: t('stats.satisfaction.label'),
      icon: <ThumbsUp className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />,
    },
    {
      value: 12,
      suffix: '+',
      label: t('stats.years.label'),
      icon: <Award className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />,
    },
    {
      value: 24,
      suffix: '/7',
      label: t('stats.support.label'),
      icon: <Clock className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />,
    },
  ];

  return (
    <section ref={ref} className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-accent-700 dark:from-primary-700 dark:via-primary-800 dark:to-accent-700"></div>

      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-white/30 dark:text-white/40"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <ParallaxLayer depth={1.5} baseSpeed={0.15}>
        <motion.div
          className="absolute top-1/4 start-1/4 w-96 h-96 bg-white/10 dark:bg-white/10 rounded-full blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </ParallaxLayer>
      <ParallaxLayer depth={1.2} baseSpeed={0.12}>
        <motion.div
          className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent-500/20 dark:bg-accent-500/20 rounded-full blur-[120px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </ParallaxLayer>

      <div className="max-w-7xl mx-auto relative z-dropdown">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4 tracking-tight">
            {t('stats.title')}
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto">{t('stats.subtitle')}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={statCard} className="group relative">
              <div className="relative h-full p-6 lg:p-8 rounded-2xl bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/20 hover:bg-white/15 dark:hover:bg-white/15 hover:border-white/30 dark:hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-dropdown text-center">
                  <div className="flex items-center justify-center mb-4 text-white">
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-white mb-3 tracking-tight">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={isInView} />
                  </div>

                  <div className="text-sm md:text-base text-white font-medium leading-relaxed">
                    {stat.label}
                  </div>
                </div>

                <div className="absolute bottom-0 start-0 end-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rtl:bg-gradient-to-l opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
