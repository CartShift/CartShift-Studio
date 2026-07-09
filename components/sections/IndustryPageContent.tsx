'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Counter } from '@/components/ui/Counter';
import { useInView } from '@/lib/motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageHero } from '@/components/sections/PageHero';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { isRTLLocale } from '@/lib/locale-config';
import {
  ShoppingBag,
  Utensils,
  Heart,
  Cpu,
  Palette,
  Store,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Zap,
  Shield,
  Target,
} from 'lucide-react';

type IndustrySlug = 'fashion' | 'food' | 'health' | 'tech' | 'arts' | 'local';

interface IndustryConfig {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  bgGradient: string;
  accentColor: string;
}

const INDUSTRY_CONFIG: Record<IndustrySlug, IndustryConfig> = {
  fashion: {
    icon: ShoppingBag,
    color: 'text-pink-600 dark:text-pink-400',
    bgGradient: 'from-pink-600 to-accent-600',
    accentColor: 'pink',
  },
  food: {
    icon: Utensils,
    color: 'text-orange-600 dark:text-orange-400',
    bgGradient: 'from-orange-600 to-red-600',
    accentColor: 'orange',
  },
  health: {
    icon: Heart,
    color: 'text-green-600 dark:text-green-400',
    bgGradient: 'from-green-600 to-teal-600',
    accentColor: 'green',
  },
  tech: {
    icon: Cpu,
    color: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-600 to-primary-600',
    accentColor: 'blue',
  },
  arts: {
    icon: Palette,
    color: 'text-accent-600 dark:text-accent-400',
    bgGradient: 'from-accent-600 to-primary-600',
    accentColor: 'accent',
  },
  local: {
    icon: Store,
    color: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-600 to-yellow-600',
    accentColor: 'amber',
  },
};

interface IndustryPageContentProps {
  industry: IndustrySlug;
}

export const IndustryPageContent: React.FC<IndustryPageContentProps> = ({ industry }) => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = isRTLLocale(locale);
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: '-100px' });

  const config = INDUSTRY_CONFIG[industry];
  const IndustryIcon = config.icon;

  // Industry content from translations
  type IndustryBenefit = { title: string; description: string };
  type IndustryPageCopy = { title: string; subtitle: string; description: string };
  interface IndustriesContent {
    benefits: IndustryBenefit[];
    services: string[];
    fashion: IndustryPageCopy;
    food: IndustryPageCopy;
    health: IndustryPageCopy;
    tech: IndustryPageCopy;
    arts: IndustryPageCopy;
    local: IndustryPageCopy;
  }
  const industriesContent = t.raw('industriesContent' as never) as IndustriesContent;

  const content = industriesContent[industry];

  const genericBenefits = industriesContent.benefits.map((benefit: IndustryBenefit, index: number) => ({
    icon: [TrendingUp, Zap, Shield, Target][index],
    title: benefit.title,
    description: benefit.description,
  }));

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('industries.title'), href: '#' },
    { label: content.title, href: `/industries/${industry}` },
  ];

  return (
    <>
      <PageHero
        title={content.title}
        subtitle={content.subtitle}
        description={content.description}
      />

      <div className="bg-surface-50 dark:bg-black border-b border-surface-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Industry Icon Banner */}
      <Section background="default" className="!py-12">
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center shadow-2xl`}
          >
            <IndustryIcon size={48} className="text-white" />
          </motion.div>
        </div>
      </Section>

      {/* Benefits Grid */}
      <Section
        background="default"
        className="relative overflow-hidden border-b border-surface-200 dark:border-white/5"
      >
        <SectionHeader
          title={t('industries.whyWorkWithUs')}
          subtitle={t('industries.benefitsTailored')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {genericBenefits.map(
            (benefit: { icon: React.ComponentType<{ className?: string; size?: number }>; title: string; description: string }, index: number) => {
              const BenefitIcon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-surface-950 border border-surface-200 dark:border-white/5 hover:border-accent-300 dark:hover:border-accent-700 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4`}
                  >
                    <BenefitIcon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 font-display">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            }
          )}
        </div>
      </Section>

      {/* Services */}
      <Section background="default" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            title={t('industries.ourServices')}
            subtitle={t('industries.everythingNeeded')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...industriesContent.services].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isHe ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-950/40"
              >
                <CheckCircle2 size={20} className={config.color} />
                <span className="text-surface-700 dark:text-surface-300">{service}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section
        background="default"
        className="relative overflow-hidden border-y border-surface-200 dark:border-white/5 shadow-2xl"
      >
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 150, suffix: '+', label: t('industries.projects') },
            { value: 98, suffix: '%', label: t('industries.satisfaction') },
            { value: 2.5, suffix: 'x', label: t('industries.avgGrowth') },
            { value: 24, suffix: '/7', label: t('industries.support') },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isStatsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6"
            >
              <div className={`text-4xl md:text-5xl font-bold mb-2 ${config.color}`}>
                <Counter value={stat.value} suffix={stat.suffix} inView={isStatsInView} />
              </div>
              <div className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="default" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white font-display mb-6 leading-tight tracking-tight">
              {t('industries.readyToGetStarted')}
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('industries.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="group">
                  <span className="relative z-dropdown flex items-center gap-2">
                    {t('industries.getFreeQuote')}
                    <ArrowRight size={20} className="rtl:rotate-180" />
                  </span>
                </Button>
              </Link>
              <Link href="/work">
                <Button variant="outline" size="lg">
                  {t('industries.viewOurWork')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  );
};
