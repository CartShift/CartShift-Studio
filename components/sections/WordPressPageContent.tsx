'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FAQ, FAQItem } from '@/components/ui/FAQ';
import { ProcessSection } from '@/components/sections/ProcessSection';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getDateLocaleString } from '@/lib/locale-config';

export const WordPressPageContent: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const services = t.raw('wordpress.services.items') as any[];
  const whyItems = t.raw('wordpress.why.items') as any[];
  const faqData = t.raw('wordpress.faq' as any) as {
    title: string;
    subtitle: string;
    items: FAQItem[];
  };
  const faqItems = faqData?.items || [];
  const learnMoreData = t.raw('wordpress.learnMore' as any) as {
    title: string;
    excerpt: string;
    category: string;
    date: string;
    href: string;
  };
  const formattedDate = new Date(learnMoreData.date).toLocaleDateString(
    getDateLocaleString(locale)
  );

  return (
    <>
      <Section background="default" className="relative overflow-hidden">
        <SectionHeader
          title={t('wordpress.services.title')}
          subtitle={t('wordpress.services.subtitle')}
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
            {t('wordpress.why.title')}{' '}
            <span className="gradient-text">{t('wordpress.why.titleSpan')}</span>
          </motion.h2>
          <div className="space-y-6">
            {whyItems.map((item, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed"
              >
                <strong className="text-surface-900 dark:text-white">{item.strong}</strong>{' '}
                {item.text}
              </motion.p>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <Card hover className="h-full group relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-accent-600 dark:text-primary-400 uppercase tracking-wider">
                    {learnMoreData.category}
                  </span>
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    {formattedDate}
                  </span>
                </div>
                <CardTitle>
                  <Link
                    href={learnMoreData.href}
                    className="text-surface-900 dark:text-white hover:text-accent-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {learnMoreData.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
                  {learnMoreData.excerpt}
                </p>
                <Link href={learnMoreData.href}>
                  <button className="text-accent-600 dark:text-primary-400 font-bold hover:text-accent-700 dark:hover:text-primary-300 transition-colors text-base md:text-lg flex items-center gap-2 group/link">
                    {t('blog.readMore')}
                    <svg
                      className="w-5 h-5 group-hover/link:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover/link:-translate-x-1"
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
                  </button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      <ProcessSection processPath="wordpress.process" />

      <Section background="light" className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            title={faqData?.title || t('wordpress.faq.title')}
            subtitle={
              faqData?.subtitle ||
              'Everything you need to know about our WordPress e-commerce development services'
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
              {t('wordpress.cta.title')}{' '}
              <span className="gradient-text">{t('wordpress.cta.titleSpan')}</span>
            </h2>
            <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('wordpress.cta.description')}
            </p>
            <Link href="/contact">
              <Button size="lg" className="group">
                <span className="relative z-10 flex items-center gap-2">
                  {t('wordpress.cta.button')}
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
