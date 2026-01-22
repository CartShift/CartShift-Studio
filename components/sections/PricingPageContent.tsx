'use client';

import { useEffect } from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FAQ } from '@/components/ui/FAQ';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageHero } from '@/components/sections/PageHero';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { trackPricingView, trackPackageClick } from '@/lib/analytics';
import { useSystemSettings } from '@/lib/hooks/useSystemSettings';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';

interface PackageCardProps {
  name: string;
  description: string;
  price: string;
  timeline: string;
  features: string[];
  cta: string;
  popular?: boolean;
  popularBadge?: string;
  index: number;
}

const PackageCard: React.FC<PackageCardProps> = ({
  name,
  description,
  price,
  timeline,
  features,
  cta,
  popular,
  popularBadge,
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
      <div className="absolute -top-3 start-1/2 -translate-x-1/2 z-dropdown">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wide">
          <Icon name="star" size={12} />
          {popularBadge || 'Most Popular'}
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
        <div
          className={`text-sm mt-1 ${popular ? 'text-white/70' : 'text-surface-500 dark:text-surface-500'}`}
        >
          {timeline}
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
      <Link href="/contact" className="block mt-auto" onClick={() => trackPackageClick(name)}>
        <Button
          as="div"
          variant={popular ? 'secondary' : 'primary'}
          className={`w-full ${popular ? '!bg-white !text-accent-700 hover:!bg-white/90' : ''}`}
        >
          {cta}
        </Button>
      </Link>
    </div>
  </motion.div>
);

export const PricingPageContent: React.FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const { settings: systemSettings, loading: settingsLoading } = useSystemSettings();
  const { isAgency, loading: authLoading } = usePortalAuth();

  // Redirect if hidden and not admin
  useEffect(() => {
    if (!settingsLoading && !authLoading) {
      if (!systemSettings.isPricingPageVisible && !isAgency) {
        router.replace('/');
      }
    }
  }, [systemSettings, isAgency, settingsLoading, authLoading, router]);

  // Track pricing page view
  useEffect(() => {
    trackPricingView();
  }, []);

  if (settingsLoading || authLoading) return null;

  const pricingData = t.raw('pricing' as any) as any;

  if (!pricingData || !pricingData.packages) {
    throw new Error('Pricing translation data is missing or invalid');
  }

  const pricing = pricingData as {
    hero: { title: string; subtitle: string; description: string; badge: string };
    packages: {
      quickLaunch: {
        name: string;
        description: string;
        price: string;
        timeline: string;
        features: string[];
        cta: string;
      };
      growthUpgrade: {
        name: string;
        description: string;
        price: string;
        timeline: string;
        popular: boolean;
        features: string[];
        cta: string;
      };
      customBuild: {
        name: string;
        description: string;
        price: string;
        timeline: string;
        features: string[];
        cta: string;
      };
      storeAudit: {
        name: string;
        description: string;
        price: string;
        timeline: string;
        features: string[];
        cta: string;
      };
    };
    included: { title: string; items: string[] };
    notIncluded: { title: string; items: string[] };
    faq: { title: string; subtitle?: string; items: Array<{ question: string; answer: string }> };
    cta: { title: string; titleSpan: string; description: string; button: string };
  };

  const popularBadgeText = (pricing as any).popularBadge || '';
  const packages = [
    { ...pricing.packages.storeAudit, index: 0 },
    { ...pricing.packages.quickLaunch, index: 1 },
    { ...pricing.packages.growthUpgrade, popular: true, popularBadge: popularBadgeText, index: 2 },
    { ...pricing.packages.customBuild, index: 3 },
  ];

  const faqItems = pricing.faq.items.map(item => ({
    question: item.question,
    answer: item.answer,
  }));

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: pricing.hero.title, href: '/pricing' },
  ];

  return (
    <>
      <PageHero
        title={pricing.hero.title}
        subtitle={pricing.hero.subtitle}
        description={pricing.hero.description}
        badge={pricing.hero.badge}
      />
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <Section background="light" className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packages.map(pkg => (
            <PackageCard key={pkg.name} {...pkg} />
          ))}
        </div>
      </Section>

      <Section background="default" className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card hover>
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icon name="check" size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>{pricing.included.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {pricing.included.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icon
                        name="check"
                        size={18}
                        className="mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0"
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                    <Icon
                      name="info"
                      size={20}
                      className="text-surface-600 dark:text-surface-400"
                    />
                  </div>
                  <CardTitle>{pricing.notIncluded.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {pricing.notIncluded.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icon
                        name="minus"
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
        </div>
      </Section>

      <Section background="light" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <SectionHeader title={pricing.faq.title} subtitle={pricing.faq.subtitle} />
          <FAQ items={faqItems} />
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
              {pricing.cta.title} <span className="gradient-text">{pricing.cta.titleSpan}</span>
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {pricing.cta.description}
            </p>
            <Link href="/contact">
              <Button as="div" size="lg" className="group">
                <span className="relative z-10 flex items-center gap-2">
                  {pricing.cta.button}
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
