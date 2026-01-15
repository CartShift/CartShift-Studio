'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { SectionHeader } from '@/components/ui/Section';
import { useTranslations } from 'next-intl';
import { Parallax } from '@/components/ui/Parallax';
import { Icon } from '@/components/ui/Icon';

interface WhyItem {
  title: string;
  description: string;
  icon: string;
}

export const WhyChoose: React.FC = () => {
  const t = useTranslations();
  const values = t.raw('whyChoose.items') as WhyItem[];

  // Card variants for staggered animations
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
      transition: { duration: 0.5, type: 'spring', stiffness: 100 },
    },
  };

  // Bento layout configuration for 5 items
  const getGridClass = (index: number) => {
    const layouts = [
      'md:col-span-2 md:row-span-2', // Large featured (top-left)
      'md:col-span-1', // Standard (top-right)
      'md:col-span-1', // Standard (middle-right)
      'md:col-span-1', // Standard (bottom-left)
      'md:col-span-2', // Wide card (bottom-right)
    ];
    return layouts[index] || 'md:col-span-1';
  };

  const isFeature = (index: number) => index === 0;

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-white via-surface-50 to-white dark:from-surface-800 dark:via-surface-800 dark:to-surface-800 overflow-hidden">
      {/* Parallax background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ambient glow orbs with parallax */}
        <Parallax speed={0.15}>
          <div className="absolute top-[5%] start-[3%] w-[450px] h-[450px] bg-primary-500/15 dark:bg-primary-500/8 rounded-full blur-[100px]"></div>
        </Parallax>
        <Parallax speed={-0.12}>
          <div className="absolute top-[55%] end-[5%] w-[400px] h-[400px] bg-accent-500/12 dark:bg-accent-500/6 rounded-full blur-[90px]"></div>
        </Parallax>
        <Parallax speed={0.18}>
          <div className="absolute top-[35%] end-[30%] w-[550px] h-[550px] bg-primary-400/10 dark:bg-primary-400/5 rounded-full blur-[130px]"></div>
        </Parallax>
        <Parallax speed={-0.1}>
          <div className="absolute bottom-[10%] start-[25%] w-[500px] h-[500px] bg-accent-400/12 dark:bg-accent-400/6 rounded-full blur-[110px]"></div>
        </Parallax>

        {/* Floating geometric shapes - CTA style */}
        <Parallax speed={0.35}>
          <motion.div
            className="absolute top-[12%] start-[10%] w-20 h-20 border-2 border-primary-500/15 dark:border-primary-400/10 rounded-xl"
            animate={{ rotate: [0, 90, 180, 270, 360], y: [0, -20, 0, 20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
        </Parallax>

        <Parallax speed={-0.28}>
          <motion.div
            className="absolute top-[75%] end-[12%] w-16 h-16 border-2 border-accent-500/15 dark:border-accent-400/10 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={0.22}>
          <motion.div
            className="absolute top-[50%] start-[5%] w-28 h-28 border border-primary-400/8 dark:border-primary-300/6 rounded-2xl"
            animate={{ rotate: [0, -35, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={-0.32}>
          <motion.div
            className="absolute top-[22%] end-[8%] w-14 h-14 bg-accent-500/6 dark:bg-accent-400/4 rounded-lg"
            animate={{ y: [0, 25, 0], rotate: [0, 45, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={0.18}>
          <motion.div
            className="absolute bottom-[30%] end-[35%] w-12 h-12 border border-primary-500/10 dark:border-primary-400/6 rounded-full"
            animate={{ scale: [1, 1.25, 1], x: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={-0.2}>
          <motion.div
            className="absolute top-[60%] start-[40%] w-10 h-10 border-2 border-accent-400/8 dark:border-accent-300/5 rounded-lg"
            animate={{ rotate: [45, 90, 45], y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={0.28}>
          <motion.div
            className="absolute bottom-[40%] start-[60%] w-8 h-8 bg-primary-400/8 dark:bg-primary-300/5 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.03)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-dropdown">
        <div className="relative">
          <SectionHeader title={t('whyChoose.title')} subtitle={t('whyChoose.subtitle')} />

          {/* Bento Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 auto-rows-fr mt-12"
          >
            {values.map((value, index) => (
              <motion.div
                key={`${value.title}-${index}`}
                variants={cardVariants}
                className={`${getGridClass(index)} group`}
              >
                <div
                  className={`
                  h-full relative rounded-3xl transition-all duration-500 ease-out
                  ${
                    isFeature(index)
                      ? 'p-8 md:p-10 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white shadow-2xl shadow-primary-500/25 group-hover:shadow-[0_25px_60px_-12px_rgba(99,102,241,0.4)] overflow-visible'
                      : 'p-6 md:p-7 liquid-glass liquid-glass-highlight liquid-glass-animated-border overflow-hidden'
                  }
                  group-hover:-translate-y-1
                `}
                >
                  {/* Decorative gradient overlay for featured card */}
                  {isFeature(index) && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 rounded-3xl" />
                      <div className="absolute -top-[200px] -end-[200px] w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute -bottom-[150px] -start-[150px] w-64 h-64 bg-accent-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    </>
                  )}

                  {/* Hover gradient overlay for regular cards */}
                  {!isFeature(index) && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.03] via-transparent to-accent-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  )}

                  <div className="relative z-dropdown h-full flex flex-col">
                    {/* Icon */}
                    <div className="mb-6">
                      <div
                        className={`
                        inline-flex items-center justify-center rounded-2xl transition-all duration-300
                        ${
                          isFeature(index)
                            ? 'w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm group-hover:bg-white/30'
                            : 'w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 group-hover:from-primary-500/20 group-hover:to-accent-500/20 dark:group-hover:from-primary-500/30 dark:group-hover:to-accent-500/30'
                        }
                      `}
                      >
                        <Icon
                          name={value.icon}
                          className={`
                          transition-transform duration-300 group-hover:scale-110
                          ${
                            isFeature(index) ? 'text-white' : 'text-accent-600 dark:text-accent-400'
                          }
                        `}
                          size={isFeature(index) ? 32 : 28}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <h3
                        className={`
                        font-display font-bold leading-tight mb-3 transition-colors duration-300
                        ${
                          isFeature(index)
                            ? 'text-2xl md:text-3xl text-white'
                            : 'text-lg md:text-xl text-surface-900 dark:text-white'
                        }
                      `}
                      >
                        {value.title}
                      </h3>
                      <p
                        className={`
                        leading-relaxed
                        ${
                          isFeature(index)
                            ? 'text-base md:text-lg text-white'
                            : 'text-sm md:text-base text-surface-600 dark:text-surface-300'
                        }
                      `}
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
      </div>
    </section>
  );
};
