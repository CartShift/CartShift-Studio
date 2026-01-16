'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from '@/lib/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Parallax } from '@/components/ui/Parallax';
import { trackFormSubmission } from '@/components/analytics/GoogleAnalytics';
import { useTranslations } from 'next-intl';
import { useDirection } from '@/lib/i18n-utils';
import { logError } from '@/lib/error-handler';
import { getScheduleUrl } from '@/lib/schedule';
import { Icon } from '@/components/ui/Icon';
import { Mail, Clock, CheckCircle, Calendar } from 'lucide-react';
import { submitContactForm } from '@/lib/services/contact-client';

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
}

export const ContactPageContent: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, set] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>();
  const t = useTranslations();
  const direction = useDirection();

  const onSubmit = async (data: ContactFormData) => {
    set(true);
    setError(null);

    try {
      const result = await submitContactForm(data);

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
      set(false);
    }
  };

  const isRtl = direction === 'rtl';

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto relative z-dropdown">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 30 : -30 }} // Logical start
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white font-display mb-8 text-center md:text-start leading-tight tracking-tight">
              {t('contact.title')}
            </h2>
            <div className="space-y-6 text-start">
              <div className="flex items-start gap-4">
                <Parallax speed={0.15}>
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </Parallax>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-2 text-base md:text-lg">
                    {t('contact.emailLabel')}
                  </h3>
                  <a
                    href="mailto:hello@cart-shift.com"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-base md:text-lg"
                  >
                    hello@cart-shift.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Parallax speed={-0.15}>
                  <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                  </div>
                </Parallax>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-2 text-base md:text-lg">
                    {t('contact.quickResponseTitle')}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg leading-relaxed">
                    {t('contact.quickResponseText')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Parallax speed={0.2}>
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </Parallax>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-2 text-base md:text-lg">
                    {t('contact.scheduleTitle')}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-300 mb-3 text-base md:text-lg leading-relaxed">
                    {t('contact.scheduleText1')}
                  </p>
                  <a
                    href={getScheduleUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>{t('contact.scheduleNow')}</span>
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Parallax speed={-0.2}>
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 dark:bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="whatsapp" size={24} className="text-[#25D366]" />
                  </div>
                </Parallax>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-2 text-base md:text-lg">
                    {t('floatingActions.whatsapp')}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-300 mb-3 text-base md:text-lg leading-relaxed">
                    {t('contact.whatsappDescription')}
                  </p>
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972503591552'}?text=${encodeURIComponent(
                      t('contact.whatsappMessageText')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#25D366] hover:text-[#128C7E] font-medium transition-colors"
                  >
                    <Icon name="whatsapp" size={20} />
                    <span>{t('contact.sendMessage')}</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isRtl ? -30 : 30 }} // Logical end
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {submitted ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg">
                    <CheckCircle className="w-12 h-12" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white mb-4 leading-tight tracking-tight">
                    {t('contact.form.successTitle')}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-300 mb-6 text-base md:text-lg leading-relaxed">
                    {t('contact.form.successText')}
                  </p>
                  <p className="text-surface-600 dark:text-surface-300 mb-6 text-base md:text-lg leading-relaxed">
                    {isRtl
                      ? 'מעדיפים לדבר? קבעו פגישה עכשיו:'
                      : 'Prefer to talk? Schedule a meeting now:'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={getScheduleUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="w-full sm:w-auto">
                        <Calendar className="w-4 h-4 me-2" />
                        {t('contact.scheduleMeeting')}
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                      className="w-full sm:w-auto"
                    >
                      {t('contact.form.sendAnother')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl text-start">
                    {t('contact.form.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-start">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2"
                      >
                        {t('contact.form.nameLabel')} <span className="text-error">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        {...register('name', { required: t('contact.form.nameRequired') })}
                        className="w-full px-4 py-4 md:py-3 rounded-xl glass-effect text-surface-900 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all touch-manipulation"
                        placeholder={t('contact.form.namePlaceholder')}
                        aria-required="true"
                        aria-invalid={errors.name ? 'true' : 'false'}
                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      />
                      {errors.name && (
                        <p id="contact-name-error" role="alert" className="mt-1 text-sm text-error">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2"
                      >
                        {t('contact.form.emailLabel')} <span className="text-error">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="w-full px-4 py-4 md:py-3 rounded-xl glass-effect text-surface-900 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-start touch-manipulation"
                        style={{ direction: 'ltr' }}
                        placeholder={t('contact.form.emailPlaceholder')}
                        aria-required="true"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                      />
                      {errors.email && (
                        <p
                          id="contact-email-error"
                          role="alert"
                          className="mt-1 text-sm text-error"
                        >
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2"
                      >
                        {t('contact.form.companyLabel')}
                      </label>
                      <input
                        id="company"
                        type="text"
                        {...register('company')}
                        className="w-full px-4 py-4 md:py-3 rounded-xl glass-effect text-surface-900 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all touch-manipulation"
                        placeholder={t('contact.form.companyPlaceholder')}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="projectType"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2"
                      >
                        {t('contact.form.projectTypeLabel')} <span className="text-error">*</span>
                      </label>
                      <select
                        id="projectType"
                        {...register('projectType', {
                          required: t('contact.form.projectTypeRequired'),
                        })}
                        className="w-full px-4 py-4 md:py-3 rounded-xl glass-effect text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white dark:bg-surface-900 [&>option]:text-surface-900 dark:[&>option]:text-white touch-manipulation"
                        aria-required="true"
                        aria-invalid={errors.projectType ? 'true' : 'false'}
                        aria-describedby={
                          errors.projectType ? 'contact-projectType-error' : undefined
                        }
                      >
                        <option value="">{t('contact.form.selectOption')}</option>
                        <option value="shopify">{t('contact.form.options.shopify')}</option>
                        <option value="wordpress">{t('contact.form.options.wordpress')}</option>
                        <option value="consultation">
                          {t('contact.form.options.consultation')}
                        </option>
                        <option value="other">{t('contact.form.options.other')}</option>
                      </select>
                      {errors.projectType && (
                        <p
                          id="contact-projectType-error"
                          role="alert"
                          className="mt-1 text-sm text-error"
                        >
                          {errors.projectType.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2"
                      >
                        {t('contact.form.messageLabel')} <span className="text-error">*</span>
                      </label>
                      <textarea
                        id="message"
                        rows={6}
                        {...register('message', { required: t('contact.form.messageRequired') })}
                        className="w-full px-4 py-4 md:py-3 rounded-xl glass-effect text-surface-900 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all resize-none touch-manipulation"
                        placeholder={t('contact.form.messagePlaceholder')}
                        aria-required="true"
                        aria-invalid={errors.message ? 'true' : 'false'}
                        aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      />
                      {errors.message && (
                        <p
                          id="contact-message-error"
                          role="alert"
                          className="mt-1 text-sm text-error"
                        >
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                        <p className="text-sm text-error">{error}</p>
                      </div>
                    )}

                    <Button type="submit" className="w-full" size="md" disabled={loading}>
                      {loading
                        ? t('contact.form.submitting') || 'Submitting...'
                        : t('contact.form.submitButton')}
                    </Button>

                    <p className="text-xs text-surface-400 text-center">
                      {t('contact.form.privacy')}
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
