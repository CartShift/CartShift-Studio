'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { SectionHeader } from '@/components/ui/Section';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface WhyItem {
  title: string;
  description: string;
  icon: string;
}

const WhyBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.05, 0.1, 0.05],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    className={cn(
      'absolute rounded-full blur-[120px] pointer-events-none opacity-40 dark:opacity-20',
      className
    )}
  />
);

export const WhyChoose: React.FC = () => {
  const t = useTranslations();
  const values = t.raw('whyChoose.items') as WhyItem[];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const getGridClass = (index: number) => {
    const layouts = [
      'md:col-span-2 md:row-span-2', // Large featured
      'md:col-span-1',
      'md:col-span-1',
      'md:col-span-1',
      'md:col-span-2',
    ];
    return layouts[index] || 'md:col-span-1';
  };

  const isFeature = (index: number) => index === 0;

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-background dark:bg-surface-950 transition-colors duration-500 overflow-hidden">
      {/* Immersive Parallax Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <WhyBlob className="top-[5%] start-[3%] w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-500/5" />
        <WhyBlob
          className="top-[55%] end-[5%] w-[450px] h-[450px] bg-accent-500/10 dark:bg-accent-500/5"
          delay={2}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          title={t('whyChoose.title')}
          subtitle={t('whyChoose.subtitle')}
          className="mb-20"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 auto-rows-fr"
        >
          {values.map((value, index) => (
            <motion.div
              key={`${value.title}-${index}`}
              variants={cardVariants}
              className={cn(getGridClass(index), 'group')}
            >
              <div
                className={cn(
                  'h-full relative rounded-[2.5rem] transition-all duration-500 ease-out overflow-hidden transform-gpu',
                  isFeature(index)
                    ? 'p-10 md:p-14 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white shadow-2xl shadow-primary-500/40'
                    : 'p-8 md:p-10 bg-white/60 dark:bg-surface-900/40 border border-surface-200/50 dark:border-white/5 backdrop-blur-xl'
                )}
              >
                {isFeature(index) && (
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                )}

                <div className="relative z-10 h-full flex flex-col">
                  <div className="mb-8">
                    <div
                      className={cn(
                        'inline-flex items-center justify-center rounded-2xl transition-all duration-500',
                        isFeature(index)
                          ? 'w-20 h-20 bg-white/20 backdrop-blur-md'
                          : 'w-16 h-16 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      )}
                    >
                      <Icon
                        name={value.icon}
                        className={cn(
                          'transition-transform duration-500',
                          isFeature(index) && 'text-white'
                        )}
                        size={isFeature(index) ? 40 : 32}
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3
                      className={cn(
                        'font-display font-black leading-tight mb-4 transition-colors duration-500',
                        isFeature(index)
                          ? 'text-3xl md:text-5xl text-white'
                          : 'text-2xl md:text-3xl text-surface-900 dark:text-white'
                      )}
                    >
                      {value.title}
                    </h3>
                    <p
                      className={cn(
                        'leading-relaxed font-light',
                        isFeature(index)
                          ? 'text-xl text-white/90'
                          : 'text-lg text-surface-600 dark:text-surface-300'
                      )}
                    >
                      {value.description}
                    </p>
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
