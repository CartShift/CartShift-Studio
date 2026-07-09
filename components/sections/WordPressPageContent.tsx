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
import { ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackHighIntentCta } from '@/lib/marketing-cta';

const GlowBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.15, 1],
      opacity: [0.08, 0.15, 0.08],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    className={cn(
      'absolute rounded-full blur-[110px] pointer-events-none dark:opacity-20',
      className
    )}
  />
);

export const WordPressPageContent: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const services = t.raw('wordpress.services.items') as Array<{ title: string; description: string }>;
  const whyItems = t.raw('wordpress.why.items') as Array<{ strong: string; text: string }>;
  const faqData = t.raw('wordpress.faq' as never) as {
    title: string;
    subtitle: string;
    items: FAQItem[];
  };
  const faqItems = faqData?.items || [];
  const learnMoreData = t.raw('wordpress.learnMore' as never) as {
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
    <div className="bg-background dark:bg-black transition-colors duration-500">
      {/* Services Section */}
      <Section background="default" className="relative py-24 overflow-visible">
        <GlowBlob className="top-20 -start-20 w-[500px] h-[500px] bg-accent-500/20 dark:bg-accent-500/10" />

        <SectionHeader
          title={t('wordpress.services.title')}
          subtitle={t('wordpress.services.subtitle')}
          className="mb-20"
        />

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                variant="glass"
                hoverEffect="lift"
                className="h-full group p-8 md:p-10 bg-white/60 dark:bg-surface-950/40 border-surface-200/50 dark:border-white/5 backdrop-blur-xl"
              >
                <CardHeader className="p-0 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500 group-hover:bg-accent-500 group-hover:text-white transition-all">
                      <Globe size={20} />
                    </div>
                    <CardTitle className="text-2xl font-bold font-display group-hover:text-accent-500 transition-colors">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-lg leading-relaxed text-surface-600 dark:text-surface-300 font-light italic">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Why Section */}
      <Section
        background="default"
        className="relative py-24 overflow-hidden border-y border-surface-200/50 dark:border-white/5"
      >
        <GlowBlob
          className="bottom-0 -end-20 w-[600px] h-[600px] bg-primary-500/20 dark:bg-primary-600/10"
          delay={2}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-surface-900 dark:text-white font-display mb-6 tracking-tight leading-[1.1]">
              {t('wordpress.why.title')}{' '}
              <span className="gradient-text">{t('wordpress.why.titleSpan')}</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            {whyItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6 items-start group"
              >
                <div className="mt-1 flex-shrink-0 text-accent-500 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xl text-surface-600 dark:text-surface-200 leading-relaxed font-light group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                  <strong className="text-surface-900 dark:text-white font-bold">
                    {item.strong}
                  </strong>{' '}
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Featured/Learn More Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20"
          >
            <Card
              variant="glass"
              className="overflow-hidden p-0 border-accent-500/20 bg-accent-500/5 dark:bg-accent-500/5 backdrop-blur-2xl"
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="flex-1 p-8 md:p-12">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 text-xs font-bold uppercase tracking-widest">
                      {learnMoreData.category}
                    </span>
                    <span className="text-sm text-surface-400 font-medium">{formattedDate}</span>
                  </div>
                  <h3 className="text-3xl font-display font-bold text-surface-900 dark:text-white mb-6 transition-colors">
                    {learnMoreData.title}
                  </h3>
                  <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed font-light mb-10">
                    {learnMoreData.excerpt}
                  </p>
                  <Link href={learnMoreData.href}>
                    <Button
                      variant="ghost"
                      className="p-0 text-accent-600 dark:text-accent-400 hover:text-accent-700 font-bold flex items-center gap-3 transition-all group/link"
                    >
                      {t('blog.readMore')}
                      <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* Process Section */}
      <div className="py-24 bg-surface-50 dark:bg-surface-950/50">
        <ProcessSection processPath="wordpress.process" />
      </div>

      {/* FAQ Section */}
      <Section background="default" className="relative py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <SectionHeader
            title={faqData?.title || t('wordpress.faq.title')}
            subtitle={
              faqData?.subtitle ||
              'Everything you need to know about our WordPress e-commerce development services'
            }
            className="mb-16"
          />
          <div className="rounded-3xl overflow-hidden border border-surface-200/50 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
            <FAQ items={faqItems} />
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section background="default" className="relative py-32 overflow-hidden">
        <GlowBlob className="top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-500/10 blur-[150px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-7xl font-bold text-surface-900 dark:text-white font-display mb-10 leading-tight tracking-tight">
              {t('wordpress.cta.title')}
              <br />
              <span className="gradient-text font-black">{t('wordpress.cta.titleSpan')}</span>
            </h2>
            <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              {t('wordpress.cta.description')}
            </p>
            <Link
              href="/contact"
              onClick={() =>
                trackHighIntentCta({
                  ctaText: t('wordpress.cta.button'),
                  ctaLocation: 'wordpress_final_cta',
                })
              }
            >
              <Button
                size="lg"
                className="h-16 px-10 text-xl font-bold group shadow-2xl shadow-accent-500/20 hover:shadow-accent-500/40 transition-shadow bg-accent-500 hover:bg-accent-600"
              >
                <span className="flex items-center gap-3">
                  {t('wordpress.cta.button')}
                  <ArrowRight
                    className="w-6 h-6 transition-transform group-hover:translate-x-1 rtl:rotate-180"
                    strokeWidth={2.5}
                  />
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </Section>
    </div>
  );
};
