'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { trackFormSubmission } from '@/components/analytics/GoogleAnalytics';
import { submitContactForm } from '@/lib/services/contact-client';

export function WordPressSecurityLeadForm() {
  const t = useTranslations('wordpressSecurity.form');
  const locale = useLocale() as 'en' | 'he';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    setError('');

    let siteUrl: string;
    try {
      const normalized = website.trim().match(/^https?:\/\//i) ? website.trim() : `https://${website.trim()}`;
      const parsed = new URL(normalized);
      if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error('Invalid URL');
      siteUrl = parsed.toString();
    } catch {
      setError(t('invalidUrl'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        company: siteUrl.slice(0, 200),
        projectType: 'wordpress',
        locale,
        message: `[WordPress Security Check | PHP2Shell 2026 | source: wordpress-security-landing]\nWebsite: ${siteUrl}\nNotes: ${details.trim() || 'None'}`,
      });
      if (!response.success) throw new Error('Submission failed');
      trackFormSubmission('wordpress-security');
      setIsSubmitted(true);
    } catch {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  }

  const fieldClasses = 'mt-2 min-h-12 w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-base text-surface-900 outline-none transition-colors placeholder:text-surface-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/30 dark:border-white/15 dark:bg-surface-950 dark:text-white';
  const labelClasses = 'block text-sm font-semibold text-surface-800 dark:text-surface-200';

  return (
    <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-2xl shadow-primary-950/5 dark:border-white/10 dark:bg-surface-900 sm:p-8">
      {isSubmitted ? (
        <div role="status" aria-live="polite" className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-bold">{t('successTitle')}</h2>
          <p className="mt-3 text-surface-600 dark:text-surface-300">{t('successText')}</p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{t('intro')}</p>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className={labelClasses} htmlFor="wp-security-name">{t('name')}</label>
              <input id="wp-security-name" className={fieldClasses} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" placeholder={t('namePlaceholder')} />
            </div>
            <div>
              <label className={labelClasses} htmlFor="wp-security-email">{t('email')}</label>
              <input id="wp-security-email" className={fieldClasses} value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} type="email" autoComplete="email" placeholder={t('emailPlaceholder')} dir="ltr" />
            </div>
            <div>
              <label className={labelClasses} htmlFor="wp-security-website">{t('website')}</label>
              <input id="wp-security-website" className={fieldClasses} value={website} onChange={e => setWebsite(e.target.value)} required maxLength={200} inputMode="url" placeholder={t('websitePlaceholder')} dir="ltr" />
            </div>
            <div>
              <label className={labelClasses} htmlFor="wp-security-details">{t('details')}</label>
              <textarea id="wp-security-details" className={fieldClasses} rows={3} value={details} onChange={e => setDetails(e.target.value)} maxLength={1000} placeholder={t('detailsPlaceholder')} />
            </div>
            {error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-wait disabled:opacity-70">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />}
              {isLoading ? t('submitting') : t('submit')}
            </button>
            <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">{t('privacy')}</p>
          </form>
          <a href="mailto:hello@cart-shift.com?subject=WordPress%20Security%20Check" className="mt-5 block text-center text-sm font-medium text-primary-700 underline-offset-4 hover:underline dark:text-primary-300">
            {t('emailLink')}
          </a>
        </>
      )}
    </div>
  );
}
