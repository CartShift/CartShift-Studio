'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { trackFormSubmission } from '@/components/analytics/GoogleAnalytics';
import { submitContactForm } from '@/lib/services/contact-client';

export function WordPressSecurityLeadForm() {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'he' | 'de';
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
      setError(t('wordpressSecurity.form.invalidUrl'));
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
        interest: 'wordpress_security_launch_890',
        message: `[WordPress Security Launch Package | ILS 890 | up to 3 hours | source: wordpress-security-landing]\nWebsite: ${siteUrl}\nNotes: ${details.trim() || 'None'}\nCampaign attribution: ${(() => {
          const params = new URLSearchParams(window.location.search);
          return ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
            .map(key => {
              const raw = params.get(key);
              return raw ? `${key}=${raw.slice(0, 100).replace(/[\\r\n]/g, ' ')}` : '';
            })
            .filter(Boolean)
            .join(' | ') || 'direct';
        })()}`,
      });
      if (!response.success) throw new Error('Submission failed');
      trackFormSubmission('wordpress-security');
      setIsSubmitted(true);
    } catch {
      setError(t('wordpressSecurity.form.error'));
    } finally {
      setIsLoading(false);
    }
  }

  const fieldClasses = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-primary-600 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary-500/20 dark:border-white/15 dark:bg-[#0b1b2a] dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:border-[#b4d779] dark:focus-visible:ring-[#b4d779]/25';
  const labelClasses = 'block text-sm font-bold text-slate-800 dark:text-slate-200';

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_28px_75px_-42px_rgba(4,16,29,.5)] dark:border-white/15 dark:bg-[#132f40] dark:text-white sm:p-9">
      <span className="absolute start-8 top-0 h-[3px] w-28 rounded-b-full bg-[#a1c55a]" aria-hidden="true" />
      {isSubmitted ? (
        <div role="status" aria-live="polite" className="py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#a1c55a]/15">
            <CheckCircle2 className="h-9 w-9 text-primary-600 dark:text-[#b4d779]" aria-hidden="true" />
          </div>
          <h2 className="mt-7 text-2xl font-black tracking-tight">{t('wordpressSecurity.form.successTitle')}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">{t('wordpressSecurity.form.successText')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-[#e9f4e0] px-3 py-1.5 text-xs font-extrabold text-[#34601e] dark:bg-[#b4d779]/10 dark:text-[#d0ecaa]">
              {t('wordpressSecurity.offer.label')}
            </span>
            <span className="font-mono text-lg font-black tabular-nums text-slate-900 dark:text-white" dir="ltr">
              {t('wordpressSecurity.offer.price')}
            </span>
          </div>
          <h2 className="mt-5 text-[1.8rem] font-black leading-[1.2] tracking-tight sm:text-[2rem]">{t('wordpressSecurity.form.title')}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{t('wordpressSecurity.form.intro')}</p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClasses} htmlFor="wp-security-name">{t('wordpressSecurity.form.name')}</label>
                <input id="wp-security-name" className={fieldClasses} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" placeholder={t('wordpressSecurity.form.namePlaceholder')} />
              </div>
              <div>
                <label className={labelClasses} htmlFor="wp-security-email">{t('wordpressSecurity.form.email')}</label>
                <input id="wp-security-email" className={fieldClasses} value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} type="email" autoComplete="email" placeholder={t('wordpressSecurity.form.emailPlaceholder')} dir="ltr" />
              </div>
            </div>
            <div>
              <label className={labelClasses} htmlFor="wp-security-website">{t('wordpressSecurity.form.website')}</label>
              <input id="wp-security-website" className={fieldClasses} value={website} onChange={e => setWebsite(e.target.value)} required maxLength={200} inputMode="url" autoComplete="url" placeholder={t('wordpressSecurity.form.websitePlaceholder')} dir="ltr" />
            </div>

            <details className="group rounded-xl border border-slate-200 px-4 py-3 dark:border-white/15">
              <summary className="cursor-pointer text-sm font-semibold text-slate-600 marker:text-primary-600 dark:text-slate-300">
                {t('wordpressSecurity.form.details')}
              </summary>
              <div className="pt-2">
                <label className="sr-only" htmlFor="wp-security-details">{t('wordpressSecurity.form.details')}</label>
                <textarea id="wp-security-details" className={fieldClasses} rows={3} value={details} onChange={e => setDetails(e.target.value)} maxLength={1000} placeholder={t('wordpressSecurity.form.detailsPlaceholder')} />
              </div>
            </details>

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-3 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

            <button type="submit" disabled={isLoading} className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary-600 px-5 py-3.5 text-base font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-wait disabled:opacity-60 dark:bg-[#b4d779] dark:text-[#071a28] dark:hover:bg-[#c6e69b]">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />}
              {isLoading ? t('wordpressSecurity.form.submitting') : t('wordpressSecurity.form.submit')}
            </button>
            <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{t('wordpressSecurity.offer.disclosure')}</p>
            <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{t('wordpressSecurity.form.privacy')}</p>
          </form>

          <a href="mailto:hello@cart-shift.com?subject=WordPress%20Security%20Package" className="mt-5 block text-center text-sm font-semibold text-primary-700 underline-offset-4 hover:underline dark:text-[#b4d779]">
            {t('wordpressSecurity.form.emailLink')}
          </a>
        </>
      )}
    </div>
  );
}
