'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PageHero } from '@/components/sections/PageHero';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  Clock,
  FileCheck,
  Bell,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Lock,
  BarChart3,
  Sparkles,
} from 'lucide-react';

const iconMap = {
  dashboard: LayoutDashboard,
  requests: MessageSquareText,
  realtime: Clock,
  files: FileCheck,
  notifications: Bell,
  security: Shield,
  speed: Zap,
  collaboration: Users,
  mobile: Smartphone,
  global: Globe,
  privacy: Lock,
  analytics: BarChart3,
};

type IconName = keyof typeof iconMap;

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  const IconComponent = iconMap[icon] || LayoutDashboard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="h-full p-6 md:p-8 rounded-2xl bg-white dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/60 hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/[0.03] group-hover:to-accent-500/[0.03] transition-all duration-300" />

        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <IconComponent
              className="w-6 h-6 text-primary-600 dark:text-primary-400"
              strokeWidth={1.5}
            />
          </div>

          <h3 className="text-lg font-display font-bold text-surface-900 dark:text-white mb-2">
            {title}
          </h3>

          <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  index: number;
}

interface ProcessStepExtendedProps extends ProcessStepProps {
  isLast: boolean;
}

const ProcessStep: React.FC<ProcessStepExtendedProps> = ({
  number,
  title,
  description,
  index,
  isLast,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="relative flex gap-4 md:gap-6"
  >
    {/* Step Number */}
    <div className="flex-shrink-0 relative">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg shadow-primary-500/25">
        {number}
      </div>
      {/* Connecting line - hidden for last item */}
      {!isLast && (
        <div className="absolute top-10 md:top-12 start-1/2 -translate-x-1/2 w-px h-[calc(100%-1rem)] bg-gradient-to-b from-primary-500/40 to-transparent" />
      )}
    </div>

    {/* Content */}
    <div className={`flex-1 ${isLast ? '' : 'pb-6 md:pb-8'}`}>
      <h4 className="text-lg md:text-xl font-display font-bold text-surface-900 dark:text-white mb-2">
        {title}
      </h4>
      <p className="text-sm md:text-base text-surface-600 dark:text-surface-400 leading-relaxed">
        {description}
      </p>
    </div>
  </motion.div>
);

export const ClientPortalPageContent: React.FC = () => {
  const t = useTranslations();

  const portalInfo = t.raw('clientPortalPage' as any) as {
    hero: {
      badge: string;
      title: string;
      titleSpan: string;
      subtitle: string;
      description: string;
    };
    features: {
      title: string;
      subtitle: string;
      items: Array<{
        icon: IconName;
        title: string;
        description: string;
      }>;
    };
    benefits: {
      title: string;
      titleSpan: string;
      items: string[];
    };
    howItWorks: {
      title: string;
      subtitle: string;
      steps: Array<{
        title: string;
        description: string;
      }>;
    };
    preview: {
      title: string;
      subtitle: string;
      stats: {
        active: string;
        pending: string;
        completed: string;
      };
      requests: string[];
    };
    cta: {
      title: string;
      titleSpan: string;
      description: string;
      primaryButton: string;
      secondaryButton: string;
    };
  };

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('nav.tools'), href: '#' },
    { label: t('nav.clientPortal'), href: '/tools/client-portal' },
  ];

  return (
    <>
      <PageHero
        title={`${portalInfo.hero.title} ${portalInfo.hero.titleSpan}`}
        subtitle={portalInfo.hero.subtitle}
        description={portalInfo.hero.description}
        badge={portalInfo.hero.badge}
      />

      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Features Grid */}
      <Section background="default" className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 end-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 start-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-accent-500/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <SectionHeader
            title={portalInfo.features.title}
            subtitle={portalInfo.features.subtitle}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portalInfo.features.items.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-primary-600 via-primary-700 to-primary-800 dark:from-surface-900 dark:via-surface-900 dark:to-surface-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 start-0 w-[600px] h-[600px] bg-gradient-to-br from-white/10 dark:from-primary-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2" />
          <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent-500/20 dark:from-accent-500/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-4">
              {portalInfo.benefits.title}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-primary-200 to-accent-300 dark:from-primary-400 dark:via-accent-400 dark:to-primary-400">
                {portalInfo.benefits.titleSpan}
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {portalInfo.benefits.items.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 hover:bg-white/15 dark:hover:bg-white/[0.07] transition-all"
              >
                <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-500 flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-white/90 dark:text-surface-200 text-sm md:text-base leading-relaxed">
                  {benefit}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Preview / Mock Dashboard */}
      <Section background="light" className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
              {portalInfo.preview.title}
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              {portalInfo.preview.subtitle}
            </p>
          </motion.div>

          {/* Mock Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative"
          >
            <div className="relative rounded-2xl bg-surface-800/90 border border-surface-700/50 shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700/50 bg-surface-800/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-surface-700/50 text-xs text-surface-400">
                    portal.cartshift.co
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    {
                      label: portalInfo.preview.stats.active,
                      value: '3',
                      color: 'from-primary-500 to-primary-600',
                    },
                    {
                      label: portalInfo.preview.stats.pending,
                      value: '1',
                      color: 'from-yellow-500 to-amber-500',
                    },
                    {
                      label: portalInfo.preview.stats.completed,
                      value: '12',
                      color: 'from-green-500 to-emerald-500',
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="p-2 sm:p-3 md:p-4 rounded-lg md:rounded-xl bg-surface-700/30 border border-surface-600/30 text-center"
                    >
                      <div
                        className={`text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs text-surface-400 mt-0.5 sm:mt-1">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Request Cards */}
                <div className="space-y-2 sm:space-y-3">
                  {portalInfo.preview.requests.map((request, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 md:p-4 rounded-lg md:rounded-xl bg-surface-700/20 border border-surface-600/20 hover:border-surface-500/40 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0 rounded-full ${
                          i === 0 ? 'bg-primary-500' : i === 1 ? 'bg-yellow-500' : 'bg-accent-500'
                        }`}
                      />
                      <span className="flex-1 text-xs sm:text-sm text-surface-200 truncate">
                        {request}
                      </span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-surface-500 rtl:rotate-180" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating elements - hidden on small screens */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="hidden sm:block absolute -top-3 end-4 md:-end-6 p-2.5 md:p-3 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-green-400">Live updates</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, type: 'spring' }}
              className="hidden sm:block absolute -bottom-3 start-4 md:-start-6 p-2.5 md:p-3 rounded-xl bg-primary-500/20 border border-primary-500/30 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-medium text-primary-400">Instant notifications</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* How It Works */}
      <Section background="default" className="relative overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title={portalInfo.howItWorks.title}
            subtitle={portalInfo.howItWorks.subtitle}
          />

          <div className="space-y-0">
            {portalInfo.howItWorks.steps.map((step, index) => (
              <ProcessStep
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                index={index}
                isLast={index === portalInfo.howItWorks.steps.length - 1}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 start-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
              {portalInfo.cta.title}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-primary-300">
                {portalInfo.cta.titleSpan}
              </span>
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              {portalInfo.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/portal">
                <Button
                  size="lg"
                  className="w-full sm:w-auto group bg-white text-surface-900 hover:bg-white/90"
                >
                  <span className="flex items-center gap-2">
                    {portalInfo.cta.primaryButton}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
                >
                  {portalInfo.cta.secondaryButton}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};
