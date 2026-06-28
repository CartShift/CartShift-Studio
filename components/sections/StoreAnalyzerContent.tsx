'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAnalyzerProgress } from '@/lib/hooks/use-analyzer-progress';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTranslations, useLocale } from 'next-intl';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useDirection } from '@/lib/i18n-utils';
import { AnalyzerForm } from '@/components/forms/AnalyzerForm';
import { AnalysisResults } from '@/components/sections/AnalysisResults';
import { AnalyzingState } from '@/components/sections/AnalyzingState';
import {
  Zap,
  Search,
  ShoppingCart,
  Shield,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  ArrowRight,
  Sparkles,
  Eye,
  Award,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Logger } from '@/lib/logger';
import { toast } from 'sonner';
import { useStoreAnalysisMutation } from '@/lib/hooks/useStoreAnalysisMutation';
import { classifyStoreAnalysisError } from '@/lib/utils/store-analysis-errors';

import type { AnalysisResult } from '@/lib/types/analyzer';
import { ANALYZER_INTENTS, type AnalyzerIntent } from '@/lib/analyzer/funnel';
import {
  captureAnalyzerAttribution,
  getAnalyzerAttribution,
} from '@/lib/services/analyzer-attribution';
import { trackFunnelEvent } from '@/lib/services/analyzer-events';
import { Link } from '@/i18n/navigation';

type AnalyzerState = 'form' | 'analyzing' | 'results';

export const StoreAnalyzerContent: React.FC<{
  initialIntent?: AnalyzerIntent;
  relatedArticles?: Array<{ slug: string; title: string }>;
}> = ({ initialIntent, relatedArticles = [] }) => {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  const [state, setState] = useState<AnalyzerState>('form');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [intent, setIntent] = useState<AnalyzerIntent | undefined>(initialIntent);
  const analyzing = useAnalyzerProgress(state === 'analyzing');
  const { analyzeStoreAsync } = useStoreAnalysisMutation();
  const lastSubmitRef = useRef<{
    storeUrl: string;
    email: string;
    subscribeNewsletter: boolean;
    captchaToken: string;
  } | null>(null);

  useEffect(() => {
    const attribution = captureAnalyzerAttribution();
    setIntent(current => current || attribution.lastTouch.intent);
    trackFunnelEvent('store_analyzer_viewed', {
      intent: initialIntent || attribution.lastTouch.intent || 'generic',
      landing_path: attribution.lastTouch.landingPath,
      route_source: initialIntent ? 'intent_route' : 'generic_route',
    });
    if (attribution.lastTouch.partnerCode || attribution.lastTouch.referralCode) {
      trackFunnelEvent('partner_attributed', {
        partner: attribution.lastTouch.partnerCode || attribution.lastTouch.referralCode,
      });
    }
  }, [initialIntent]);

  const handleAnalyze = async (data: {
    storeUrl: string;
    email: string;
    subscribeNewsletter: boolean;
    captchaToken: string;
  }) => {
    lastSubmitRef.current = data;
    analyzing.reset();
    setState('analyzing');

    const startTime = Date.now();
    trackEvent('store_analysis_started', { store_url: data.storeUrl });
    trackFunnelEvent('store_analyzer_started', { intent: intent || 'generic' });

    try {
      trackFunnelEvent('store_analyzer_url_submitted', { intent: intent || 'generic' });
      trackFunnelEvent('store_analyzer_email_submitted', { intent: intent || 'generic' });
      const result = await analyzeStoreAsync({
        ...data,
        locale,
        intent,
        attribution: getAnalyzerAttribution(),
      });
      setResults(result);

      const duration = Date.now() - startTime;
      trackEvent('store_analysis_completed', {
        store_url: data.storeUrl,
        overall_score: result.overallScore,
        platform: result.platform || 'unknown',
        duration_ms: duration,
        used_lighthouse: result.meta?.usedLighthouse ?? false,
        used_html_fallback: result.meta?.usedHtmlFallback ?? false,
        has_visual_analysis: !!result.meta?.visualAnalysisAvailable,
        has_product_analysis: !!result.meta?.productAnalysisAvailable,
        has_competitor_analysis: !!result.meta?.competitorAnalysisAvailable,
        has_ai_analysis: !!result.aiAnalysis,
        lead_capture_status: result.meta?.leadCaptureStatus || 'unknown',
        email_report_status: result.meta?.emailReportStatus || 'unknown',
        cached: !!result.meta?.cached,
      });
      trackFunnelEvent('store_analyzer_completed', {
        intent: intent || 'generic',
        primary_issue: result.meta.primaryIssue || 'general_conversion',
        overall_score: result.overallScore,
      });

      if (result.meta?.visualAnalysisAttempted && !result.meta?.visualAnalysisAvailable) {
        trackEvent('analyzer_feature_unavailable', {
          feature_name: 'visual_analysis',
          reason: 'puppeteer_unavailable',
        });
      }
      if (result.meta?.visualAnalysisAttempted && !result.meta?.productAnalysisAvailable) {
        trackEvent('analyzer_feature_unavailable', {
          feature_name: 'product_analysis',
          reason: 'no_product_page_or_puppeteer_unavailable',
        });
      }

      if (data.subscribeNewsletter) {
        trackEvent('newsletter_signup', { signup_location: 'store_analyzer' });
      }

      const emailStatus = result.meta?.emailReportStatus;
      if (emailStatus === 'pending') {
        toast.info(t('analyzer.results.emailPendingTitle'), {
          description: t('analyzer.results.emailPendingDescription'),
          duration: 6000,
        });
      } else if (emailStatus === 'unconfigured') {
        toast.info(t('analyzer.results.emailUnavailableTitle'), {
          description: t('analyzer.results.emailUnavailableDescription'),
          duration: 5000,
        });
      }

      analyzing.markComplete();
      await new Promise(resolve => setTimeout(resolve, 350));
      setState('results');
    } catch (error) {
      Logger.error('Analysis error', error, { storeUrl: data.storeUrl });

      const duration = Date.now() - startTime;
      const classified = classifyStoreAnalysisError(error);

      trackEvent('store_analysis_failed', {
        store_url: data.storeUrl,
        error_message: error instanceof Error ? error.message : String(error),
        error_type: classified.type,
        duration_ms: duration,
      });

      toast.error(t(classified.titleKey), {
        description: t(classified.suggestionKey),
        duration: 5000,
        action: classified.retryable
          ? {
              label: t('analyzer.form.tryAgain'),
              onClick: () => {
                if (lastSubmitRef.current) {
                  void handleAnalyze(lastSubmitRef.current);
                }
              },
            }
          : undefined,
      });

      setState('form');
    }
  };

  const handleReset = () => {
    setState('form');
    setResults(null);
    analyzing.reset();
  };

  const features = [
    {
      icon: Zap,
      title: t('analyzer.features.performance.title') || 'Performance',
      description: t('analyzer.features.performance.description') || 'Load times & Core Web Vitals',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: Search,
      title: t('analyzer.features.seo.title') || 'SEO Audit',
      description: t('analyzer.features.seo.description') || 'Meta tags & indexing',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Eye,
      title: t('analyzer.features.accessibility.title') || 'Accessibility',
      description: t('analyzer.features.accessibility.description') || 'WCAG compliance',
      gradient: 'from-accent-500 to-primary-600',
    },
    {
      icon: Award,
      title: t('analyzer.features.bestPractices.title') || 'Best Practices',
      description: t('analyzer.features.bestPractices.description') || 'Security & standards',
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      icon: ShoppingCart,
      title: t('analyzer.features.cart.title') || 'Cart & Checkout',
      description: t('analyzer.features.cart.description') || 'Conversion optimization',
      gradient: 'from-green-500 to-lime-600',
    },
    {
      icon: Shield,
      title: t('analyzer.features.trust.title') || 'Trust Signals',
      description: t('analyzer.features.trust.description') || 'Reviews & policies',
      gradient: 'from-rose-500 to-red-600',
    },
  ];

  const stats = [
    { value: '6', label: t('analyzer.stats.categories'), icon: BarChart3 },
    {
      value: t('analyzer.stats.durationValue'),
      label: t('analyzer.stats.durationLabel'),
      icon: Clock,
    },
    { value: t('analyzer.stats.freeValue'), label: t('analyzer.trust.free'), icon: CheckCircle },
    { value: 'PDF', label: t('analyzer.stats.reportFormat'), icon: Sparkles },
  ];

  return (
    <AnimatePresence mode="wait">
      {state === 'form' && (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative"
        >
          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-28 md:pt-32 pb-8">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-background via-surface-50 to-background dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 transition-colors duration-300" />
              <div className="absolute top-0 start-1/4 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
              <div
                className="absolute bottom-0 end-1/4 w-[500px] h-[500px] bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-[100px] animate-pulse"
                style={{ animationDelay: '1s' }}
              />
              <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-primary-500/5 via-transparent to-accent-500/5 rounded-full blur-[80px]" />
              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-dropdown w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Left - Content */}
                <motion.div
                  initial={{ opacity: 0, x: isRtl ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center lg:text-start"
                >
                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                  >
                    {intent ? (
                      <span className="text-surface-900 dark:text-white">
                        {t(`analyzer.intents.${intent}.headline`)}
                      </span>
                    ) : (
                      <>
                        <span className="text-surface-900 dark:text-white">
                          {t('analyzer.hero.title')}
                        </span>
                        <br />
                        <span className="text-primary-600 dark:text-primary-400">
                          {t('analyzer.hero.subtitle')}
                        </span>
                      </>
                    )}
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-surface-600 dark:text-white/60 mb-8 max-w-xl mx-auto lg:mx-0"
                  >
                    {intent
                      ? t(`analyzer.intents.${intent}.description`)
                      : t('analyzer.hero.description')}
                  </motion.p>

                  <div
                    className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start"
                    aria-label={t('analyzer.intentPicker.label')}
                  >
                    {ANALYZER_INTENTS.map(value => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={intent === value}
                        onClick={() => {
                          setIntent(value);
                          trackFunnelEvent('store_analyzer_intent_selected', {
                            intent: value,
                            source: 'landing_chip',
                          });
                        }}
                        className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${intent === value ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-surface-300 text-surface-600 hover:border-primary-400 dark:border-white/15 dark:text-white/70'}`}
                      >
                        {t(`analyzer.intents.${value}.label`)}
                      </button>
                    ))}
                  </div>

                  {relatedArticles.length ? (
                    <nav
                      aria-label={t('analyzer.relatedArticles')}
                      className="mb-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm lg:justify-start"
                    >
                      {relatedArticles.map(article => (
                        <Link
                          key={article.slug}
                          href={`/blog/${article.slug}`}
                          className="text-primary-700 underline-offset-4 hover:underline dark:text-primary-300"
                        >
                          {article.title}
                        </Link>
                      ))}
                    </nav>
                  ) : null}

                  {/* Stats Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                  >
                    {stats.map((stat, i) => (
                      <div key={i} className="text-center lg:text-start">
                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                          <stat.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-2xl font-bold text-surface-900 dark:text-white">
                            {stat.value}
                          </span>
                        </div>
                        <span className="text-xs text-surface-500 dark:text-white/50">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Trust Badges */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
                  >
                    {[
                      { icon: CheckCircle, text: t('analyzer.trust.free') || 'Free forever' },
                      { icon: Shield, text: t('analyzer.trust.secure') || 'Secure & private' },
                      { icon: Star, text: t('analyzer.trust.expert') || 'Expert insights' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-surface-500 dark:text-white/50"
                      >
                        <item.icon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Right - Form */}
                <motion.div
                  initial={{ opacity: 0, x: isRtl ? -40 : 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="relative">
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/30 via-accent-500/30 to-primary-500/30 dark:from-primary-500/50 dark:via-accent-500/50 dark:to-primary-500/50 rounded-2xl blur-xl opacity-50" />

                    {/* Form Card */}
                    <div className="relative bg-white dark:bg-surface-950/90 backdrop-blur-xl border border-surface-200 dark:border-white/10 rounded-2xl p-6 lg:p-8 shadow-premium">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                            {t('analyzer.form.title') || 'Analyze Your Store'}
                          </h2>
                          <p className="text-sm text-surface-500 dark:text-white/50">
                            {t('analyzer.form.subtitle')}
                          </p>
                        </div>
                      </div>

                      <GoogleReCaptchaProvider
                        reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}
                        scriptProps={{
                          async: false,
                          defer: false,
                          appendTo: 'head',
                          nonce: undefined,
                        }}
                      >
                        <AnalyzerForm onSubmit={handleAnalyze} />
                      </GoogleReCaptchaProvider>

                      <div className="mt-6 pt-6 border-t border-surface-100 dark:border-white/10">
                        <div className="flex items-center justify-center gap-2 text-surface-400 dark:text-white/40 text-xs">
                          <Shield className="w-3.5 h-3.5" />
                          <span>
                            {t('analyzer.form.privacy') ||
                              'Your data is encrypted and never shared'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-white dark:bg-gradient-to-b dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 transition-colors duration-300" />

            <div className="relative z-dropdown max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
                  {t('analyzer.whatYouGet.title') || "What You'll Get"}
                </h2>
                <p className="text-surface-600 dark:text-white/50 max-w-2xl mx-auto">
                  {t('analyzer.whatYouGet.description') ||
                    "A comprehensive analysis covering every aspect of your store's success."}
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-xl -z-dropdown"
                      style={{
                        backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                      }}
                    />
                    <div className="relative h-full bg-white dark:bg-white/5 border border-surface-200 dark:border-white/10 rounded-xl p-5 transition-all duration-300 shadow-sm">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                      >
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-surface-600 dark:text-white/50">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-surface-50 dark:bg-surface-950 transition-colors duration-300" />

            <div className="relative z-dropdown max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
                  {t('analyzer.howItWorks.title') || 'How It Works'}
                </h2>
              </motion.div>

              <div className="relative">
                {/* Connection Line */}
                <div className="hidden md:block absolute top-12 start-[16.67%] end-[16.67%] h-0.5 bg-gradient-to-r from-primary-500/30 via-accent-500/30 to-primary-500/30 dark:from-primary-500/50 dark:via-accent-500/50 dark:to-primary-500/50" />

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      step: '1',
                      title: t('analyzer.howItWorks.step1.title') || 'Enter Your URL',
                      description:
                        t('analyzer.howItWorks.step1.description') ||
                        'Paste your store URL and email address',
                      icon: Search,
                    },
                    {
                      step: '2',
                      title: t('analyzer.howItWorks.step2.title') || 'We Analyze',
                      description:
                        t('analyzer.howItWorks.step2.description') ||
                        'Our engine scans 40+ data points',
                      icon: BarChart3,
                    },
                    {
                      step: '3',
                      title: t('analyzer.howItWorks.step3.title') || 'Get Results',
                      description: t('analyzer.howItWorks.step3.description'),
                      icon: CheckCircle,
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 }}
                      className="relative text-center"
                    >
                      <div className="relative inline-flex mb-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 border border-surface-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                          <item.icon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="absolute -top-2 -end-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/30">
                          {item.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-surface-600 dark:text-white/50">{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 via-background to-background dark:via-surface-900 dark:to-surface-950 transition-colors duration-300" />

            <div className="relative z-dropdown max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
                  {t('analyzer.cta.title') || 'Ready to Improve Your Store?'}
                </h2>
                <p className="text-surface-600 dark:text-white/50 mb-8">
                  {t('analyzer.cta.description') ||
                    'Get your free analysis now and discover opportunities to boost conversions.'}
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-500 dark:to-accent-500 hover:from-primary-500 hover:to-accent-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5"
                >
                  {t('analyzer.cta.analyzeNow') || 'Analyze My Store Now'}
                  <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </motion.div>
            </div>
          </section>
        </motion.div>
      )}

      {state === 'analyzing' && (
        <motion.div
          key="analyzing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0a0a0f] pt-24 sm:pt-28 md:pt-32"
        >
          <AnalyzingState
            progress={analyzing.progress}
            currentStep={t(`analyzer.steps.${analyzing.phase}`)}
            elapsedMs={analyzing.elapsedMs}
            phase={analyzing.phase}
          />
        </motion.div>
      )}

      {state === 'results' && results && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-background dark:bg-[#0a0a0f] pt-24 sm:pt-28 md:pt-32 pb-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnalysisResults
              results={results}
              initialEmail={lastSubmitRef.current?.email}
              onReset={handleReset}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
