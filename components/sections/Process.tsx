'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';

import { useTranslations } from 'next-intl';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export const Process: React.FC = () => {
  const t = useTranslations();

  const steps: ProcessStep[] = [
    {
      number: '01',
      title: t('process.steps.discovery.title'),
      description: t('process.steps.discovery.description'),
      icon: 'search',
    },
    {
      number: '02',
      title: t('process.steps.design.title'),
      description: t('process.steps.design.description'),
      icon: 'palette',
    },
    {
      number: '03',
      title: t('process.steps.develop.title'),
      description: t('process.steps.develop.description'),
      icon: 'code',
    },
    {
      number: '04',
      title: t('process.steps.launch.title'),
      description: t('process.steps.launch.description'),
      icon: 'rocket',
    },
  ];

  return (
    <Section background="default" className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-1/2 start-1/2 rtl:translate-x-1/2 ltr:-translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-500/5 to-transparent rounded-full"></div>
      </div>

      <SectionHeader title={t('process.title')} subtitle={t('process.subtitle')} />

      {/* Process Timeline */}
      <div className="relative">
        {/* Connection Line - Desktop */}
        <div className="hidden lg:block absolute top-24 start-0 end-0 h-0.5 bg-gradient-to-r from-transparent via-surface-300 dark:via-surface-700 to-transparent rtl:bg-gradient-to-l"></div>

        {/* Animated line overlay */}
        <motion.div
          className="hidden lg:block absolute top-24 start-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rtl:bg-gradient-to-l"
          initial={{ width: '0%' }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Step Card */}
              <div className="relative group">
                {/* Number Circle */}
                <motion.div
                  className="relative mx-auto w-20 h-20 mb-8"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl opacity-20 blur-lg group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative w-full h-full bg-white dark:bg-surface-900 border-2 border-surface-300/70 dark:border-surface-700 group-hover:border-accent-500/50 rounded-2xl flex items-center justify-center transition-[border-color,box-shadow] duration-300 shadow-lg">
                    <span className="text-2xl font-display font-bold bg-gradient-to-br from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon floating above */}
                  <div className="absolute -top-2 -end-2 w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                    <Icon name={step.icon} className="text-white flex-shrink-0" size={16} />
                  </div>
                </motion.div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-display font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-surface-600 dark:text-surface-300 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>

                {/* Connection - Mobile/Tablet */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex flex-col items-center py-4">
                    <motion.div
                      className="w-0.5 h-8 bg-gradient-to-b from-accent-500 to-primary-500"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      style={{ transformOrigin: 'top' }}
                    />
                    <motion.div
                      className="w-3 h-3 rounded-full bg-accent-500"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};
