'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FAQ, FAQItem } from '@/components/ui/FAQ';
import { ProcessSection } from '@/components/sections/ProcessSection';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
  Gauge,
  FileSearch,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackHighIntentCta } from '@/lib/marketing-cta';

const GlowBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.08, 0.15, 0.08],
    }}
    transition={{
      duration: 10,
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

export const ShopifyPageContent: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = locale === 'he';

  const services = t.raw('shopify.services.items') as Array<{
    title: string;
    description: string;
  }>;
  const whyItems = t.raw('shopify.why.items') as string[];
  const learnMoreData = t.raw('shopify.learnMore' as never) as {
    title: string;
    description: string;
    links: Array<{ title: string; href: string }>;
  };
  const faqData = t.raw('shopify.faq' as never) as {
    title: string;
    subtitle: string;
    items: FAQItem[];
  };
  const faqItems = faqData?.items || [];
  const seoFocusAreas = isHe
    ? [
        {
          icon: FileSearch,
          title: 'אודיט Shopify SEO ממוקד',
          description:
            'אנחנו מזהים בעיות אינדוקס, קנוניקל, היררכיית תוכן, כוונת חיפוש וקישורים פנימיים לפני שהן ממשיכות לחסום צמיחה אורגנית.',
        },
        {
          icon: Gauge,
          title: 'מהירות ו-Core Web Vitals',
          description:
            'שיפור LCP, CLS, JS מיותר, מדיה כבדה ואפליקציות שמאטות את החנות ומשפיעות גם על UX וגם על ביצועים אורגניים.',
        },
        {
          icon: Workflow,
          title: 'הגירה וצמיחה בלי לאבד מומנטום',
          description:
            'שומרים על נכסי SEO חשובים בזמן רה-פלטפורמינג, שינוי מבנה או פיתוח פיצ׳רים חדשים שמטרתם להגדיל לידים ומכירות.',
        },
      ]
    : [
        {
          icon: FileSearch,
          title: 'Focused Shopify SEO audits',
          description:
            'We uncover indexing, canonical, content hierarchy, search-intent, and internal-linking issues before they keep suppressing organic growth.',
        },
        {
          icon: Gauge,
          title: 'Speed and Core Web Vitals work',
          description:
            'We improve LCP, CLS, redundant JS, heavy media, and app bloat that slows the store down and hurts both UX and rankings.',
        },
        {
          icon: Workflow,
          title: 'Migration-safe growth implementation',
          description:
            'We preserve important SEO signals during rebuilds, migrations, and feature rollouts so growth work does not wipe out existing visibility.',
        },
      ];

  const partnerReasons = isHe
    ? [
        'אפליקציות נותנות הצעות כלליות. אנחנו מחברים בין SEO, UX, ביצועים ומטרות עסקיות לפי מה שבאמת קורה בחנות שלכם.',
        'תיקונים טכניים בלי אסטרטגיה יוצרים עבודה חלקית. אנחנו בונים סדר עדיפויות שמחזק גם דירוגים וגם המרות.',
        'חנויות בצמיחה צריכות מישהו שיכול גם לאבחן וגם ליישם. אצלנו אין מעבר בין “יועץ” ל”מפתח” - אותו צוות מוביל עד ביצוע.',
      ]
    : [
        'Apps can surface generic tips. We connect SEO, UX, performance, and business goals around what is actually happening in your store.',
        'Technical fixes without prioritization create busywork. We sequence improvements so rankings and conversions can compound together.',
        'Growing stores need a partner who can both diagnose and implement. We do not stop at recommendations and hand you a backlog.',
      ];

  const localTrust = isHe
    ? {
        title: 'מתאים גם לצוותים בישראל וגם לפעילות גלובלית',
        description:
          'אנחנו עובדים בעברית ובאנגלית, רגילים ללוחות זמנים בישראל, ויודעים לבנות עמודי שירות ומסרים שמדברים גם לשוק המקומי וגם לחיפושים באנגלית.',
        primary: 'שיחת ייעוץ על Shopify SEO',
        secondary: 'אודיט חינם לחנות',
      }
    : {
        title: 'Built for Israeli teams and international growth',
        description:
          'We work in English and Hebrew, understand Israeli operating rhythms, and help brands translate technical SEO into clear growth priorities for global traffic.',
        primary: 'Book a Shopify SEO consultation',
        secondary: 'Run a free store audit',
      };

  return (
    <div className="bg-background dark:bg-black transition-colors duration-500">
      {/* Services Grid */}
      <Section background="default" className="relative py-24 overflow-visible">
        <GlowBlob className="top-20 -start-20 w-[500px] h-[500px] bg-primary-500/20 dark:bg-primary-500/10" />

        <SectionHeader
          title={t('shopify.services.title')}
          subtitle={t('shopify.services.subtitle')}
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
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                      <Sparkles size={20} />
                    </div>
                    <CardTitle className="text-2xl font-bold font-display group-hover:text-primary-500 transition-colors">
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
          className="bottom-0 -end-20 w-[600px] h-[600px] bg-accent-500/20 dark:bg-accent-600/10"
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
              {t('shopify.why.title')}{' '}
              <span className="gradient-text">{t('shopify.why.titleSpan')}</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            {whyItems.map((text, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6 items-start group"
              >
                <div className="mt-1 flex-shrink-0 text-primary-500 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xl text-surface-600 dark:text-surface-200 leading-relaxed font-light group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Learn More Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20"
          >
            <Card
              variant="glass"
              className="overflow-hidden p-8 md:p-12 border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/5 backdrop-blur-2xl"
            >
              <div className="grid lg:grid-cols-3 gap-10 items-center">
                <div className="lg:col-span-2">
                  <h3 className="text-3xl font-display font-bold text-surface-900 dark:text-white mb-4">
                    {learnMoreData?.title || t('shopify.learnMore.title')}
                  </h3>
                  <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed font-light">
                    {learnMoreData?.description ||
                      'Explore our comprehensive guides on Shopify development, optimization, and best practices.'}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {learnMoreData?.links?.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="group flex items-center justify-between p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-surface-200/50 dark:border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-300 shadow-sm"
                    >
                      <span className="font-semibold text-surface-700 dark:text-surface-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {link.title}
                      </span>
                      <ArrowRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all rtl:rotate-180" />
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </Section>

      <Section
        background="default"
        className="relative py-24 overflow-hidden border-t border-surface-200/50 dark:border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title={isHe ? 'מה אנחנו משפרים בפועל' : 'What we actually improve'}
            subtitle={
              isHe
                ? 'Shopify SEO אמיתי דורש חיבור בין טכני, תוכן, מהירות והמרות'
                : 'Real Shopify SEO work blends technical fixes, content structure, speed, and conversion clarity.'
            }
            className="mb-14"
          />

          <div className="grid gap-8 lg:grid-cols-3">
            {seoFocusAreas.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-surface-200/60 bg-white/70 p-8 dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="p-0">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                      <item.icon size={22} />
                    </div>
                    <CardTitle className="text-2xl font-display">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pt-4">
                    <p className="text-base leading-relaxed text-surface-600 dark:text-surface-300">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/blog/shopify-seo-complete-guide">
              <Button variant="outline" size="lg">
                <span className="flex items-center gap-2">
                  {isHe ? 'המדריך המלא ל-Shopify SEO' : 'Read the Shopify SEO pillar guide'}
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </span>
              </Button>
            </Link>
            <Link href="/tools/store-analyzer">
              <Button size="lg">
                <span className="flex items-center gap-2">
                  {isHe ? 'בדקו את החנות שלכם' : 'Audit your store now'}
                  <Search className="w-5 h-5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Process Section - Integrated */}
      <div className="py-24 bg-surface-50 dark:bg-surface-950/50">
        <ProcessSection processPath="shopify.process" />
      </div>

      <Section
        background="default"
        className="relative py-24 overflow-hidden border-y border-surface-200/50 dark:border-white/5"
      >
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            title={
              isHe
                ? 'למה לעבוד עם שותף ולא רק עם אפליקציות'
                : 'Why work with a partner instead of just apps'
            }
            subtitle={
              isHe
                ? 'אפליקציות יכולות לעזור, אבל הן לא מחליפות אסטרטגיה, יישום ותעדוף חכם.'
                : 'Apps can help, but they do not replace strategy, implementation, and smart prioritization.'
            }
            className="mb-14"
          />
          <div className="space-y-6">
            {partnerReasons.map((reason, index) => (
              <motion.div
                key={reason}
                initial={{ opacity: 0, x: isHe ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-2xl border border-surface-200/60 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-lg leading-relaxed text-surface-700 dark:text-surface-200">
                  {reason}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section background="default" className="relative py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <SectionHeader
            title={faqData?.title || t('shopify.faq.title')}
            subtitle={
              faqData?.subtitle ||
              'Everything you need to know about our Shopify development services'
            }
            className="mb-16"
          />
          <div className="rounded-3xl overflow-hidden border border-surface-200/50 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
            <FAQ items={faqItems} />
          </div>
        </div>
      </Section>

      <Section background="default" className="relative py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <Card className="border-primary-500/20 bg-gradient-to-br from-primary-500/10 via-white to-accent-500/10 p-8 dark:from-primary-950/20 dark:via-black dark:to-accent-950/20">
            <CardContent className="p-0">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-display font-bold text-surface-900 dark:text-white">
                    {localTrust.title}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
                    {localTrust.description}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Link
                    href="/contact"
                    onClick={() =>
                      trackHighIntentCta({
                        ctaText: localTrust.primary,
                        ctaLocation: 'shopify_local_trust',
                      })
                    }
                  >
                    <Button size="lg" className="w-full sm:w-auto">
                      {localTrust.primary}
                    </Button>
                  </Link>
                  <Link href="/tools/store-analyzer">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      {localTrust.secondary}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA Section */}
      <Section background="default" className="relative py-32 overflow-hidden">
        <GlowBlob className="top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/10 blur-[150px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-7xl font-bold text-surface-900 dark:text-white font-display mb-10 leading-tight tracking-tight">
              {t('shopify.cta.title')}
              <br />
              <span className="gradient-text font-black">{t('shopify.cta.titleSpan')}</span>
            </h2>
            <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              {t('shopify.cta.description')}
            </p>
            <Link
              href="/contact"
              onClick={() =>
                trackHighIntentCta({
                  ctaText: t('shopify.cta.button'),
                  ctaLocation: 'shopify_final_cta',
                })
              }
            >
              <Button
                size="lg"
                className="h-16 px-10 text-xl font-bold group shadow-2xl shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow"
              >
                <span className="flex items-center gap-3">
                  {t('shopify.cta.button')}
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
