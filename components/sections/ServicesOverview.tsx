'use client';

import React from 'react';
import { motion } from "@/lib/motion";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';
import { TiltCard } from '@/components/ui/TiltCard';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Check, ArrowRight } from 'lucide-react';

export const ServicesOverview: React.FC = () => {
  const t = useTranslations();

  const services = [
    {
      title: t('servicesOverview.shopify.title'),
      description: t('servicesOverview.shopify.description'),
      features: t.raw('servicesOverview.shopify.features') as string[],
      href: '/solutions/shopify',
      icon: 'shopping-cart',
      gradient: 'from-primary-500/20 to-accent-500/20',
    },
    {
      title: t('servicesOverview.wordpress.title'),
      description: t('servicesOverview.wordpress.description'),
      features: t.raw('servicesOverview.wordpress.features') as string[],
      href: '/solutions/wordpress',
      icon: 'globe',
      gradient: 'from-accent-500/20 to-primary-500/20',
    },
  ];

  return (
    <Section background="default" className="relative overflow-hidden">
      <SectionHeader
        title={t('servicesOverview.title')}
        subtitle={t('servicesOverview.subtitle')}
      />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {services.map((service, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
          >
            <TiltCard tiltStrength={8} glare>
              <Card hover accent className="h-full group relative overflow-hidden">
                <CardHeader>
                  <div className="w-20 h-20 mb-6 rounded-2xl bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center border border-surface-300/60 dark:border-surface-700 group-hover:border-accent-500/50 transition-colors duration-300">
                    <Icon
                      name={service.icon}
                      className="text-accent-500 dark:text-accent-400 flex-shrink-0"
                      size={40}
                    />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mb-4">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-8 text-base md:text-lg leading-relaxed text-surface-700 dark:text-surface-200">
                    {service.description}
                  </p>
                  <ul className="space-y-4 mb-10">
                    {service.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        className="flex items-start"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + idx * 0.1 }}
                      >
                        <Check
                          className="w-6 h-6 text-accent-500 dark:text-accent-400 me-4 mt-0.5 flex-shrink-0"
                          strokeWidth={2.5}
                        />
                        <span className="text-surface-700 dark:text-surface-200 text-base md:text-lg font-medium">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <Link
                    href={service.href}
                    aria-label={`${t('common.learnMore')} ${service.title}`}
                    className="group/link inline-flex items-center gap-3 px-6 py-3 border-2 border-accent-600 dark:border-accent-500 bg-transparent hover:bg-accent-600 dark:hover:bg-accent-500 text-accent-600 dark:text-accent-400 hover:text-white dark:hover:text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg shine-sweep"
                  >
                    {t('common.learnMore')} {service.title}
                    <ArrowRight
                      className="w-5 h-5 transition-transform group-hover/link:translate-x-1 rtl:group-hover/link:-translate-x-1 rtl:rotate-180"
                      strokeWidth={2.5}
                    />
                  </Link>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

