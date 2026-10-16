'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { captureAnalyzerAttribution, getAnalyzerAttribution } from '@/lib/services/analyzer-attribution';
import { CONSENT_CHANGED_EVENT, isAnalyticsConsentGranted } from '@/lib/analytics-consent';
import { trackFunnelEvent } from '@/lib/services/analyzer-events';
import type { StoreReviewFocus } from '@/lib/domain/store-review';

const focuses: StoreReviewFocus[] = ['conversion','speed','seo','trust','checkout'];

function InnerForm({ initialFocus }: { initialFocus?: StoreReviewFocus }) {
  const t = useTranslations('storeReview');
  const locale = useLocale() as 'en' | 'he';
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [focus, setFocus] = useState<StoreReviewFocus | undefined>(initialFocus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const idRef = useRef<string | null>(null);
  const viewTrackedRef = useRef(false);
  useEffect(() => {
    const recordView = () => {
      if (viewTrackedRef.current || !isAnalyticsConsentGranted()) return;
      captureAnalyzerAttribution();
      trackFunnelEvent('expert_review_page_viewed', { intent: initialFocus || 'generic' });
      viewTrackedRef.current = true;
    };
    recordView();
    window.addEventListener(CONSENT_CHANGED_EVENT, recordView);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, recordView);
  }, [initialFocus]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    try {
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !executeRecaptcha) {
        throw new Error('SECURITY_CHECK_FAILED');
      }
      const captchaToken = executeRecaptcha
        ? await executeRecaptcha('request_store_review') : '';
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
        throw new Error('SECURITY_CHECK_FAILED');
      }
      if (!idRef.current) idRef.current = crypto.randomUUID();
      const response = await fetch('/api/store-review-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl: String(form.get('storeUrl') || ''),
          name: String(form.get('name') || ''),
          email: String(form.get('email') || ''),
          notes: String(form.get('notes') || ''),
          website: String(form.get('website') || ''),
          locale, focus, marketingOptIn: form.get('marketingOptIn') === 'on',
          attribution: getAnalyzerAttribution(), captchaToken,
          submissionId: idRef.current,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        if (response.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(result.error || 'GENERIC');
      }
      setRequestId(result.requestId);
      trackFunnelEvent('expert_review_submitted', { intent: focus || 'generic' });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'GENERIC';
      const known = ['INVALID_INPUT','INVALID_STORE_URL','SECURITY_CHECK_FAILED','INTAKE_PAUSED',
        'SERVICE_UNAVAILABLE','SAVE_FAILED','ORIGIN_NOT_ALLOWED','RATE_LIMIT'] as const;
      setError(t(`errors.${known.find(value => value === code) || 'GENERIC'}`));
    } finally {
      setPending(false);
    }
  }

  if (requestId) {
    return <div role="status" className="space-y-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6">
      <CheckCircle2 size={36} className="text-emerald-600" aria-hidden="true" />
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{t('successTitle')}</h2>
      <p className="leading-relaxed text-surface-600 dark:text-surface-300">{t('successText')}</p>
      <p className="break-all text-xs text-surface-500">{t('successReference')}: <b dir="ltr">{requestId}</b></p>
    </div>;
  }

  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-2 text-sm font-medium text-surface-800 dark:text-surface-200">
        <span>{t('name')}</span>
        <input name="name" required minLength={2} maxLength={120} autoComplete="name"
          placeholder={t('namePlaceholder')} disabled={pending}
          className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-surface-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:bg-surface-900 dark:text-white"/>
      </label>
      <label className="block space-y-2 text-sm font-medium text-surface-800 dark:text-surface-200">
        <span>{t('email')}</span>
        <input name="email" type="email" required maxLength={320} autoComplete="email" dir="ltr"
          placeholder={t('emailPlaceholder')} disabled={pending}
          className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-surface-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:bg-surface-900 dark:text-white"/>
      </label>
    </div>
    <label className="block space-y-2 text-sm font-medium text-surface-800 dark:text-surface-200">
      <span>{t('storeUrl')}</span>
      <input name="storeUrl" type="text" inputMode="url" dir="ltr" required maxLength={2048}
        placeholder={t('storeUrlPlaceholder')} disabled={pending}
        className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-surface-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:bg-surface-900 dark:text-white"/>
    </label>
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-surface-800 dark:text-surface-200">{t('focusLabel')} <span className="text-surface-400">({t('optional')})</span></legend>
      <div className="flex flex-wrap gap-2">
        {focuses.map(value => <button key={value} type="button" disabled={pending}
          aria-pressed={focus === value} onClick={() => setFocus(current => current === value ? undefined : value)}
          className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 ${focus === value ? 'border-primary-500 bg-primary-500/15 text-primary-700 dark:text-primary-300' : 'border-surface-300 text-surface-600 hover:border-primary-500 dark:border-white/15 dark:text-surface-300'}`}>
          {t(`focus.${value}`)}
        </button>)}
      </div>
    </fieldset>
    <label className="block space-y-2 text-sm font-medium text-surface-800 dark:text-surface-200">
      <span>{t('notes')}</span>
      <textarea name="notes" maxLength={1000} rows={2} disabled={pending}
        placeholder={t('notesPlaceholder')}
        className="w-full resize-y rounded-xl border border-surface-300 bg-white px-4 py-3 text-surface-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:bg-surface-900 dark:text-white"/>
    </label>
    <label className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-300">
      <input type="checkbox" name="marketingOptIn" disabled={pending} className="mt-1 accent-primary-600"/>
      <span>{t('marketing')}</span>
    </label>
    <input name="website" autoComplete="off" tabIndex={-1} aria-hidden="true" className="absolute -start-[9999px]" />
    {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">{t('errorTitle')} {error}</p>}
    <Button type="submit" size="lg" loading={pending} disabled={pending} className="w-full">
      {pending ? t('submitting') : t('submit')} {!pending && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
    </Button>
    <p className="text-xs leading-relaxed text-surface-500">{t('privacy')} <Link className="underline" href="/privacy">{t('privacyLink')}</Link>.</p>
  </form>;
}

export function StoreReviewRequestForm({ initialFocus }: { initialFocus?: StoreReviewFocus }) {
  return <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}>
    <InnerForm initialFocus={initialFocus} />
  </GoogleReCaptchaProvider>;
}
