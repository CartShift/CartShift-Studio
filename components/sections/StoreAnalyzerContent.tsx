'use client';

import React, { useRef, useState } from 'react';
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

import type { AnalysisResult } from '@/lib/types/analyzer';

type AnalyzerState = 'form' | 'analyzing' | 'results';

export const StoreAnalyzerContent: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  const [state, setState] = useState<AnalyzerState>('form');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const lastSubmitRef = useRef<{
    storeUrl: string;
    email: string;
    subscribeNewsletter: boolean;
    captchaToken: string;
  } | null>(null);

  const handleAnalyze = async (data: {
    storeUrl: string;
    email: string;
    subscribeNewsletter: boolean;
    captchaToken: string;
  }) => {
    lastSubmitRef.current = data;
    setState('analyzing');
    setAnalyzingProgress(0);

    const startTime = Date.now();
    trackEvent('store_analysis_started', { store_url: data.storeUrl });

    const steps = [
      { progress: 12, label: t('analyzer.steps.connecting') },
      { progress: 28, label: t('analyzer.steps.performance') },
      { progress: 44, label: t('analyzer.steps.seo') },
      { progress: 58, label: t('analyzer.steps.ux') },
      { progress: 72, label: t('analyzer.steps.trust') },
      { progress: 88, label: t('analyzer.steps.generating') },
    ];

    let stepIndex = 0;
    const progressTimer = window.setInterval(() => {
      const step = steps[Math.min(stepIndex, steps.length - 1)];
      setCurrentStep(step.label);
      setAnalyzingProgress(step.progress);
      if (stepIndex < steps.length - 1) {
        stepIndex += 1;
      }
    }, 700);

    try {
      const response = await fetch('/api/analyze-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale }),
      });

      window.clearInterval(progressTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setResults(result);

      const duration = Date.now() - startTime;
      trackEvent('store_analysis_completed', {
        store_url: data.storeUrl,
        overall_score: result.overallScore,
        platform: result.platform || 'unknown',
        duration_ms: duration,
        has_puppeteer: !!(result.visualAnalysis || result.productAnalysis),
        has_visual_analysis: !!result.visualAnalysis,
        has_product_analysis: !!result.productAnalysis,
        has_competitor_analysis: !!result.competitorAnalysis?.competitors?.length,
        has_ai_analysis: !!result.aiAnalysis,
      });

      // Track feature unavailability
      if (!result.visualAnalysis) {
        trackEvent('analyzer_feature_unavailable', {
          feature_name: 'visual_analysis',
          reason: 'puppeteer_unavailable',
        });
      }
      if (!result.productAnalysis) {
        trackEvent('analyzer_feature_unavailable', {
          feature_name: 'product_analysis',
          reason: 'no_product_page_or_puppeteer_unavailable',
        });
      }

      if (data.subscribeNewsletter) {
        trackEvent('newsletter_signup', { signup_location: 'store_analyzer' });
      }

      if (result.meta?.emailReportStatus === 'failed') {
        toast.warning(t('analyzer.results.emailDelayedTitle'), {
          description: t('analyzer.results.emailDelayedDescription'),
          duration: 6000,
        });
      }

      setAnalyzingProgress(100);
      setCurrentStep(t('analyzer.steps.complete'));
      await new Promise(resolve => setTimeout(resolve, 400));
      setState('results');
    } catch (error) {
      window.clearInterval(progressTimer);
      Logger.error('Analysis error', error, { storeUrl: data.storeUrl });

      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Classify error type and create user-friendly messages
      let errorType: 'network' | 'timeout' | 'validation' | 'server' | 'unknown' = 'unknown';
      let userMessage = 'We could not analyze this store.';
      let suggestion = 'Please verify the URL and try again.';

      if (errorMessage.includes('Could not access store URL')) {
        errorType = 'network';
        userMessage = 'Unable to connect to the store.';
        suggestion = 'Check if the URL is correct and the store is online.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorType = 'network';
        userMessage = 'Network connection failed.';
        suggestion = 'Check your internet connection and try again.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        errorType = 'timeout';
        userMessage = 'Analysis took too long.';
        suggestion = 'The store may be slow. Please try again in a moment.';
      } else if (errorMessage.includes('Invalid URL') || errorMessage.includes('required')) {
        errorType = 'validation';
        userMessage = 'Invalid store URL.';
        suggestion = 'Please enter a valid store URL (e.g., https://example.com).';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('Too many')) {
        errorType = 'validation';
        userMessage = 'Too many requests.';
        suggestion = 'Please wait a minute before trying again.';
      } else if (errorMessage.includes('Captcha')) {
        errorType = 'validation';
        userMessage = 'Captcha verification failed.';
        suggestion = 'Please refresh the page and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('Analysis failed')) {
        errorType = 'server';
        userMessage = 'Server error occurred.';
        suggestion = 'Our team has been notified. Please try again later.';
      }

      trackEvent('store_analysis_failed', {
        store_url: data.storeUrl,
        error_message: errorMessage,
        error_type: errorType,
        duration_ms: duration,
      });

      // Show user-friendly error with toast
      toast.error(userMessage, {
        description: suggestion,
        duration: 5000,
        action:
          errorType === 'validation'
            ? undefined
            : {
                label: t('analyzer.form.tryAgain'),
                onClick: () => {
                  if (lastSubmitRef.current) {
                    void handleAnalyze(lastSubmitRef.current);
                  }
                },
              },
      });

      setState('form');
    }
  };

  const handleReset = () => {
    setState('form');
    setResults(null);
    setAnalyzingProgress(0);
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
      gradient: 'from-purple-500 to-pink-600',
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
    { value: '60s', label: t('analyzer.trust.instant'), icon: Clock },
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
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:to-accent-500/20 border border-primary-500/20 dark:border-primary-500/30 mb-6"
                  >
                    <Sparkles className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                    <span className="text-sm font-medium text-surface-900 dark:text-white/90">
                      {t('analyzer.hero.badge') || 'Free Tool • No Credit Card Required'}
                    </span>
                  </motion.div>

                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                  >
                    <span className="text-surface-900 dark:text-white">
                      {t('analyzer.hero.title')?.split(' ').slice(0, -2).join(' ') ||
                        'Free E-Commerce'}
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 dark:from-primary-400 dark:via-accent-400 dark:to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                      {t('analyzer.hero.subtitle') || 'Store Analyzer'}
                    </span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-surface-600 dark:text-white/60 mb-8 max-w-xl mx-auto lg:mx-0"
                  >
                    {t('analyzer.hero.description') ||
                      "Get actionable insights to boost your store's performance, SEO, and conversions. Instant results in 60 seconds."}
                  </motion.p>

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
                            {t('analyzer.form.subtitle') || 'Get your free report in 60 seconds'}
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
                      description:
                        t('analyzer.howItWorks.step3.description') ||
                        'Receive instant insights + full email report',
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
          <AnalyzingState progress={analyzingProgress} currentStep={currentStep} />
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
            <AnalysisResults results={results} onReset={handleReset} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
