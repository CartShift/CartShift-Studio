'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FAQ } from '@/components/ui/FAQ';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageHero } from '@/components/sections/PageHero';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface PlanCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  index: number;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  description,
  features,
  cta,
  popular,
  index,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    className="relative h-full"
  >
    {popular && (
      <div className="absolute -top-3 start-1/2 -translate-x-1/2 z-10">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wide">
          <Icon name="star" size={12} />
          Recommended
        </span>
      </div>
    )}
    <div
      className={`h-full rounded-2xl p-6 lg:p-8 flex flex-col ${
        popular
          ? 'bg-accent-600 text-white ring-2 ring-accent-500 ring-offset-2 ring-offset-white dark:ring-offset-surface-950'
          : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700'
      }`}
    >
      <div className="mb-6">
        <h3
          className={`text-xl font-bold mb-2 ${popular ? 'text-white' : 'text-surface-900 dark:text-white'}`}
        >
          {name}
        </h3>
        <p
          className={`text-sm ${popular ? 'text-white/80' : 'text-surface-600 dark:text-surface-400'}`}
        >
          {description}
        </p>
      </div>
      <div className="mb-6">
        <div
          className={`text-3xl font-bold ${popular ? 'text-white' : 'text-surface-900 dark:text-white'}`}
        >
          {price}
        </div>
      </div>
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Icon
              name="check"
              size={18}
              className={`mt-0.5 flex-shrink-0 ${popular ? 'text-white' : 'text-accent-600 dark:text-accent-400'}`}
            />
            <span
              className={`text-sm ${popular ? 'text-white/90' : 'text-surface-600 dark:text-surface-400'}`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/contact" className="block mt-auto">
        <Button
          variant={popular ? 'secondary' : 'primary'}
          className={`w-full ${popular ? '!bg-white !text-accent-700 hover:!bg-white/90' : ''}`}
        >
          {cta}
        </Button>
      </Link>
    </div>
  </motion.div>
);

export const MaintenancePageContent: React.FC = () => {
  const t = useTranslations();

  const maintenance = t.raw('maintenance' as any) as {
    hero: { title: string; subtitle: string; description: string; badge: string };
    plans: {
      essential: {
        name: string;
        price: string;
        description: string;
        features: string[];
        cta: string;
      };
      growth: {
        name: string;
        price: string;
        popular: boolean;
        description: string;
        features: string[];
        cta: string;
      };
      premium: {
        name: string;
        price: string;
        description: string;
        features: string[];
        cta: string;
      };
    };
    coverage: {
      title: string;
      technical: { title: string; items: string[] };
      support: { title: string; items: string[] };
      performance: { title: string; items: string[] };
    };
    terms: { title: string; items: string[] };
    faq: { title: string; subtitle?: string; items: Array<{ question: string; answer: string }> };
    cta: { title: string; titleSpan: string; description: string; button: string };
  };

  const plans = [
    { ...maintenance.plans.essential, index: 0 },
    { ...maintenance.plans.growth, popular: true, index: 1 },
    { ...maintenance.plans.premium, index: 2 },
  ];

  const coverageSections = [
    { ...maintenance.coverage.technical, icon: 'settings' },
    { ...maintenance.coverage.support, icon: 'headphones' },
    { ...maintenance.coverage.performance, icon: 'chart-up' },
  ];

  const faqItems = maintenance.faq.items.map(item => ({
    question: item.question,
    answer: item.answer,
  }));

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: maintenance.hero.title, href: '/maintenance' },
  ];

  return (
    <>
      <PageHero
        title={maintenance.hero.title}
        subtitle={maintenance.hero.subtitle}
        description={maintenance.hero.description}
        badge={maintenance.hero.badge}
      />
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <Section background="light" className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </Section>

      <Section background="default" className="relative overflow-hidden">
        <SectionHeader title={maintenance.coverage.title} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coverageSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Card hover className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                      <Icon
                        name={section.icon}
                        size={20}
                        className="text-accent-600 dark:text-accent-400"
                      />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Icon
                          name="check"
                          size={16}
                          className="mt-0.5 text-accent-600 dark:text-accent-400 flex-shrink-0"
                        />
                        <span className="text-surface-600 dark:text-surface-400">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section background="light" className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card hover>
              <CardHeader>
                <CardTitle>{maintenance.terms.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {maintenance.terms.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icon
                        name="info"
                        size={18}
                        className="mt-0.5 text-surface-400 dark:text-surface-500 flex-shrink-0"
                      />
                      <span className="text-surface-600 dark:text-surface-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card hover>
              <CardHeader>
                <CardTitle>{maintenance.faq.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <FAQ items={faqItems} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      <Section background="default" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white font-display mb-8 leading-tight tracking-tight">
              {maintenance.cta.title}{' '}
              <span className="gradient-text">{maintenance.cta.titleSpan}</span>
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {maintenance.cta.description}
            </p>
            <Link href="/contact">
              <Button size="lg" className="group">
                <span className="relative z-10 flex items-center gap-2">
                  {maintenance.cta.button}
                  <svg
                    className="w-5 h-5 transition-transform rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </Section>
    </>
  );
};
