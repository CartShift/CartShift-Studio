'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { trackFormSubmission } from '@/components/analytics/GoogleAnalytics';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useDirection } from '@/lib/i18n-utils';
import { logError } from '@/lib/error-handler';
import { getScheduleUrl } from '@/lib/schedule';
import { Mail, Clock, CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { submitContactForm } from '@/lib/services/contact-client';

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
}

const FOCUS_TRANSLATION_KEYS = {
  performance: 'marketing.contactPrefill.focusAreas.performance',
  seo: 'marketing.contactPrefill.focusAreas.seo',
  accessibility: 'marketing.contactPrefill.focusAreas.accessibility',
  bestPractices: 'marketing.contactPrefill.focusAreas.bestPractices',
  cart: 'marketing.contactPrefill.focusAreas.cart',
  trust: 'marketing.contactPrefill.focusAreas.trust',
} as const;

export const ContactPageContent: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const locale = useLocale() as 'en' | 'he';
  const t = useTranslations();

  const prefill = useMemo(() => {
    const projectType = searchParams.get('projectType') || '';
    const storeUrl = searchParams.get('storeUrl') || '';
    const score = searchParams.get('score');
    const focus = searchParams.get('focus');

    if (!score && !storeUrl) {
      return { projectType: projectType || '', message: '' };
    }

    const focusKey =
      focus && focus in FOCUS_TRANSLATION_KEYS
        ? FOCUS_TRANSLATION_KEYS[focus as keyof typeof FOCUS_TRANSLATION_KEYS]
        : null;
    const focusLabel = focusKey ? t(focusKey) : '';
    const message = t('marketing.contactPrefill.message', {
      store: storeUrl ? ` (${storeUrl})` : '',
      score: score || '—',
      focus: focusLabel ? t('marketing.contactPrefill.focusClause', { focus: focusLabel }) : '',
    });

    return {
      projectType: projectType || 'consultation',
      message,
      company: storeUrl || undefined,
    };
  }, [searchParams, t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    defaultValues: {
      projectType: prefill.projectType,
      message: prefill.message,
      company: prefill.company,
    },
  });

  useEffect(() => {
    reset({
      projectType: prefill.projectType,
      message: prefill.message,
      company: prefill.company,
    });
  }, [prefill, reset]);

  const direction = useDirection();

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await submitContactForm({
        ...data,
        locale,
      });

      if (!result.success) {
        throw new Error(result.error || t('portal.requests.form.failedToSubmit'));
      }

      trackFormSubmission('contact-form');
      setSubmitted(true);
    } catch (error) {
      logError('Form submission error', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again or contact us directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isRtl = direction === 'rtl';

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-background dark:bg-black transition-colors duration-500 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 start-0 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] -translate-x-1/2" />
        <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-surface-900 dark:text-white mb-12 tracking-tight leading-[1.1]">
              {t('contact.title')}
            </h2>

            <div className="space-y-10">
              <div className="flex items-start gap-6 group">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 transition-all duration-500">
                  <Mail size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                    {t('contact.emailLabel')}
                  </h3>
                  <a
                    href="mailto:hello@cart-shift.com"
                    className="text-2xl text-primary-600 dark:text-primary-400 font-display font-black hover:tracking-wider transition-all"
                  >
                    hello@cart-shift.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center flex-shrink-0 transition-all duration-500">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                    {t('contact.quickResponseTitle')}
                  </h3>
                  <p className="text-lg text-surface-500 dark:text-surface-400 font-light leading-relaxed max-w-sm">
                    {t('contact.quickResponseText')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 transition-all duration-500">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                    {t('contact.scheduleTitle')}
                  </h3>
                  <p className="text-lg text-surface-500 dark:text-surface-400 font-light mb-4 leading-relaxed max-w-sm">
                    {t('contact.scheduleText1')}
                  </p>
                  <a
                    href={getScheduleUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-primary-600 dark:text-primary-400 font-black group-hover:gap-5 transition-all text-lg"
                  >
                    <Calendar size={20} />
                    <span>{t('contact.scheduleNow')}</span>
                    <ArrowRight size={20} className="rtl:rotate-180" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative rounded-[2.5rem] p-8 md:p-12 bg-white/60 dark:bg-surface-950/40 backdrop-blur-xl border border-surface-200/50 dark:border-white/10 shadow-premium">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg">
                    <CheckCircle className="w-14 h-14" strokeWidth={2} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-surface-900 dark:text-white mb-4 tracking-tight">
                    {t('contact.form.successTitle')}
                  </h3>
                  <p className="text-lg text-surface-600 dark:text-surface-300 mb-10 font-light">
                    {t('contact.form.successText')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href={getScheduleUrl()} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="w-full sm:w-auto h-14 font-black">
                        <Calendar className="w-5 h-5 me-2" />
                        {t('contact.scheduleMeeting')}
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setSubmitted(false)}
                      className="w-full sm:w-auto h-14 border-surface-300 dark:border-white/10 font-black"
                    >
                      {t('contact.form.sendAnother')}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-surface-500 dark:text-surface-400 uppercase tracking-widest mb-3 ps-2">
                      {t('contact.form.nameLabel')}
                    </label>
                    <input
                      {...register('name', { required: true })}
                      placeholder={t('contact.form.namePlaceholder')}
                      className="w-full h-16 px-6 rounded-2xl bg-surface-50 dark:bg-white/5 border border-surface-200 dark:border-white/5 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none hover:bg-white dark:hover:bg-white/[0.08]"
                    />
                    {errors.name && (
                      <p className="mt-2 ps-2 text-sm text-red-600 dark:text-red-400">
                        {isRtl ? 'אנא הזינו שם' : 'Please enter your name'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-black text-surface-500 dark:text-surface-400 uppercase tracking-widest mb-3 ps-2">
                      {t('contact.form.emailLabel')}
                    </label>
                    <input
                      {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                      placeholder={t('contact.form.emailPlaceholder')}
                      style={{ direction: 'ltr' }}
                      className="w-full h-16 px-6 rounded-2xl bg-surface-50 dark:bg-white/5 border border-surface-200 dark:border-white/5 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none hover:bg-white dark:hover:bg-white/[0.08]"
                    />
                    {errors.email && (
                      <p className="mt-2 ps-2 text-sm text-red-600 dark:text-red-400">
                        {isRtl ? 'אנא הזינו אימייל תקין' : 'Please enter a valid email'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-black text-surface-500 dark:text-surface-400 uppercase tracking-widest mb-3 ps-2">
                      {t('contact.form.projectTypeLabel')}
                    </label>
                    <select
                      {...register('projectType', { required: true })}
                      className="w-full h-16 px-6 rounded-2xl bg-surface-50 dark:bg-white/5 border border-surface-200 dark:border-white/5 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none appearance-none hover:bg-white dark:hover:bg-white/[0.08]"
                    >
                      <option value="">{t('contact.form.selectOption')}</option>
                      <option value="shopify">{t('contact.form.options.shopify')}</option>
                      <option value="wordpress">{t('contact.form.options.wordpress')}</option>
                      <option value="consultation">{t('contact.form.options.consultation')}</option>
                      <option value="other">{t('contact.form.options.other')}</option>
                    </select>
                    {errors.projectType && (
                      <p className="mt-2 ps-2 text-sm text-red-600 dark:text-red-400">
                        {isRtl ? 'בחרו סוג פרויקט' : 'Please choose a project type'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-black text-surface-500 dark:text-surface-400 uppercase tracking-widest mb-3 ps-2">
                      {t('contact.form.messageLabel')}
                    </label>
                    <textarea
                      rows={5}
                      {...register('message', { required: true })}
                      placeholder={t('contact.form.messagePlaceholder')}
                      className="w-full p-6 rounded-2xl bg-surface-50 dark:bg-white/5 border border-surface-200 dark:border-white/5 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none resize-none hover:bg-white dark:hover:bg-white/[0.08]"
                    />
                    {errors.message && (
                      <p className="mt-2 ps-2 text-sm text-red-600 dark:text-red-400">
                        {isRtl
                          ? 'ספרו לנו קצת על הפרויקט'
                          : 'Please tell us a bit about the project'}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 text-xl font-black shadow-premium"
                  >
                    {loading ? t('contact.form.submitting') : t('contact.form.submitButton')}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
