'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHumanReviewMutation } from '@/lib/hooks/useHumanReviewMutation';
import { getAnalyzerAttribution } from '@/lib/services/analyzer-attribution';
import { trackFunnelEvent } from '@/lib/services/analyzer-events';
import type { AnalysisResult } from '@/lib/types/analyzer';

export function HumanReviewForm({
  results,
  initialEmail,
}: {
  results: AnalysisResult;
  initialEmail?: string;
}) {
  const t = useTranslations('analyzer.humanReview');
  const locale = useLocale() as 'en' | 'he';
  const mutation = useHumanReviewMutation();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-start text-emerald-700 dark:text-emerald-300"
      >
        {t('confirmation')}
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="lg"
        onClick={() => {
          setOpen(true);
          trackFunnelEvent('human_review_requested', {
            primary_issue: results.meta.primaryIssue || 'general_conversion',
          });
        }}
      >
        {t('button')}
      </Button>
    );
  }

  return (
    <form
      className="w-full max-w-2xl space-y-4 rounded-2xl border border-primary-500/25 bg-white/80 p-5 text-start dark:bg-surface-950/80"
      onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          await mutation.mutateAsync({
            email: String(form.get('email') || ''),
            storeUrl: results.storeUrl,
            locale,
            platform: String(form.get('platform') || '') || undefined,
            primaryGoal: String(form.get('primaryGoal') || '') || undefined,
            monthlyTraffic: String(form.get('monthlyTraffic') || '') || undefined,
            monthlyRevenue: String(form.get('monthlyRevenue') || '') || undefined,
            biggestConcern: String(form.get('biggestConcern') || '') || undefined,
            primaryIssue: results.meta.primaryIssue || 'general_conversion',
            intent: results.meta.analyzerIntent,
            overallScore: results.overallScore,
            anonymousInsightConsent: form.get('anonymousInsightConsent') === 'on',
            namedStoreConsent: form.get('namedStoreConsent') === 'on',
            consentVersion: '2026-06-28',
            attribution: getAnalyzerAttribution(),
            website: String(form.get('website') || ''),
          });
          trackFunnelEvent('human_review_submitted', {
            primary_issue: results.meta.primaryIssue || 'general_conversion',
          });
          setSubmitted(true);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t('error'));
        }
      }}
    >
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute start-[-9999px]"
      />
      <div>
        <h3 className="text-xl font-bold">{t('title')}</h3>
        <p className="mt-1 text-sm text-surface-600 dark:text-white/60">{t('description')}</p>
      </div>
      <Input
        name="email"
        type="email"
        required
        defaultValue={initialEmail}
        placeholder={t('email')}
        aria-label={t('email')}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          name="platform"
          defaultValue={results.platform || ''}
          placeholder={t('platform')}
          aria-label={t('platform')}
        />
        <Input name="primaryGoal" placeholder={t('primaryGoal')} aria-label={t('primaryGoal')} />
        <Input
          name="monthlyTraffic"
          placeholder={t('monthlyTraffic')}
          aria-label={t('monthlyTraffic')}
        />
        <Input
          name="monthlyRevenue"
          placeholder={t('monthlyRevenue')}
          aria-label={t('monthlyRevenue')}
        />
      </div>
      <textarea
        name="biggestConcern"
        maxLength={1000}
        placeholder={t('biggestConcern')}
        aria-label={t('biggestConcern')}
        className="min-h-24 w-full rounded-lg border border-surface-300 bg-transparent p-3 text-sm dark:border-white/15"
      />
      <label className="flex items-start gap-3 text-sm">
        <input name="anonymousInsightConsent" type="checkbox" className="mt-1" />
        <span>{t('anonymousConsent')}</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input name="namedStoreConsent" type="checkbox" className="mt-1" />
        <span>{t('namedConsent')}</span>
      </label>
      <p className="text-xs text-surface-500">{t('capacity')}</p>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
