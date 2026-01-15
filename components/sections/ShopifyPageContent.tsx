'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FAQ, FAQItem } from '@/components/ui/FAQ';
import { ProcessSection } from '@/components/sections/ProcessSection';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export const ShopifyPageContent: React.FC = () => {
  const t = useTranslations();

  const services = t.raw('shopify.services.items') as Array<{
    title: string;
    description: string;
  }>;
  const whyItems = t.raw('shopify.why.items') as string[];
  const learnMoreData = t.raw('shopify.learnMore' as any) as {
    title: string;
    description: string;
    links: Array<{ title: string; href: string }>;
  };
  const faqData = t.raw('shopify.faq' as any) as {
    title: string;
    subtitle: string;
    items: FAQItem[];
  };
  const faqItems = faqData?.items || [];

  return (
    <>
      <Section background="default" className="relative overflow-hidden">
        <SectionHeader
          title={t('shopify.services.title')}
          subtitle={t('shopify.services.subtitle')}
        />
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card hover className="h-full group relative overflow-hidden">
                <CardHeader>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base md:text-lg leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section background="light" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white font-display mb-8 text-center leading-tight tracking-tight"
          >
            {t('shopify.why.title')}{' '}
            <span className="gradient-text">{t('shopify.why.titleSpan')}</span>
          </motion.h2>
          <div className="space-y-6">
            {whyItems.map((text, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed"
              >
                {text}
              </motion.p>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <Card hover className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">
                  {learnMoreData?.title || t('shopify.learnMore.title')}
                </CardTitle>
                <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
                  {learnMoreData?.description ||
                    'Explore our comprehensive guides on Shopify development, optimization, and best practices.'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {learnMoreData?.links?.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="group p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-accent-300 dark:hover:border-accent-600 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm md:text-base font-medium text-surface-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                          {link.title}
                        </span>
                        <svg
                          className="w-4 h-4 text-surface-400 group-hover:text-accent-600 dark:group-hover:text-accent-400 group-hover:translate-x-1 transition-all rtl:rotate-180 rtl:group-hover:-translate-x-1"
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
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      <ProcessSection processPath="shopify.process" />

      <Section background="light" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            title={faqData?.title || t('shopify.faq.title')}
            subtitle={
              faqData?.subtitle ||
              'Everything you need to know about our Shopify development services'
            }
          />
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
              {t('shopify.cta.title')}{' '}
              <span className="gradient-text">{t('shopify.cta.titleSpan')}</span>
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('shopify.cta.description')}
            </p>
            <Link href="/contact">
              <Button size="lg" className="group">
                <span className="relative z-dropdown flex items-center gap-2">
                  {t('shopify.cta.button')}
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
