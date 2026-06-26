'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { AnalysisMeta, AnalyzerFeatureAvailability } from '@/lib/types/analyzer';

type CoverageStatus = 'active' | 'partial' | 'unavailable';

const UNAVAILABLE_REASON_CODES = new Set([
  'browser_disabled',
  'browser_launch_failed',
  'browser_sampling_failed',
  'pagespeed_unavailable',
  'competitor_failed',
  'email_unconfigured',
  'lead_unconfigured',
]);

function resolveStatus(active: boolean, partial?: boolean): CoverageStatus {
  if (active) return 'active';
  if (partial) return 'partial';
  return 'unavailable';
}

function statusFromAvailability(
  availability: AnalyzerFeatureAvailability | undefined,
  fallbackActive: boolean,
  fallbackPartial?: boolean
): CoverageStatus {
  if (!availability) return resolveStatus(fallbackActive, fallbackPartial);
  if (
    !availability.available &&
    availability.reasonCode &&
    UNAVAILABLE_REASON_CODES.has(availability.reasonCode)
  ) {
    return 'unavailable';
  }
  return resolveStatus(availability.available, availability.attempted && !availability.available);
}

const statusStyles: Record<
  CoverageStatus,
  { icon: typeof CheckCircle2; className: string; labelKey: string }
> = {
  active: {
    icon: CheckCircle2,
    className: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
    labelKey: 'active',
  },
  partial: {
    icon: CircleDashed,
    className: 'text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10',
    labelKey: 'partial',
  },
  unavailable: {
    icon: XCircle,
    className: 'text-surface-500 dark:text-white/40 border-white/10 bg-white/5',
    labelKey: 'unavailable',
  },
};

interface AnalyzerCoverageStripProps {
  meta: AnalysisMeta;
  isDark?: boolean;
}

export function AnalyzerCoverageStrip({ meta, isDark = false }: AnalyzerCoverageStripProps) {
  const t = useTranslations('analyzer.results.coverage');

  const reasonText = (
    availability: AnalyzerFeatureAvailability | undefined
  ) => {
    if (!availability?.reasonCode) return '';
    const key = `reasons.${availability.reasonCode}` as const;
    return t.has(key as any) ? t(key as any) : availability.reason || '';
  };

  const emailAvailability = meta.featureAvailability?.email ?? {
    attempted: meta.emailReportStatus !== 'unconfigured',
    available: meta.emailReportStatus === 'sent',
    reasonCode:
      meta.emailReportStatus === 'pending'
        ? 'email_pending'
      : meta.emailReportStatus === 'failed'
          ? 'email_failed'
          : meta.emailReportStatus === 'unconfigured'
            ? 'email_unconfigured'
            : undefined,
  };

  const leadAvailability = meta.featureAvailability?.lead ?? {
    attempted: meta.leadCaptureStatus !== 'unconfigured',
    available: meta.leadCaptureStatus === 'captured' || meta.leadCaptureStatus === 'deduped',
    reasonCode:
      meta.leadCaptureStatus === 'failed'
        ? 'lead_failed'
        : meta.leadCaptureStatus === 'unconfigured'
          ? 'lead_unconfigured'
          : undefined,
  };

  const items: {
    key: string;
    status: CoverageStatus;
    reason?: string;
  }[] = [
    {
      key: 'lighthouse',
      status: statusFromAvailability(
        meta.featureAvailability?.lighthouse,
        meta.usedLighthouse,
        !meta.usedLighthouse && meta.usedHtmlFallback
      ),
      reason: reasonText(meta.featureAvailability?.lighthouse),
    },
    {
      key: 'visual',
      status: statusFromAvailability(
        meta.featureAvailability?.visual,
        meta.visualAnalysisAvailable,
        meta.visualAnalysisAttempted && !meta.visualAnalysisAvailable
      ),
      reason: reasonText(meta.featureAvailability?.visual),
    },
    {
      key: 'product',
      status: statusFromAvailability(
        meta.featureAvailability?.product,
        meta.productAnalysisAvailable,
        meta.productAnalysisAttempted && !meta.productAnalysisAvailable
      ),
      reason: reasonText(meta.featureAvailability?.product),
    },
    {
      key: 'deeperScan',
      status: statusFromAvailability(
        meta.featureAvailability?.deeperScan,
        Boolean(meta.deeperScanAvailable),
        meta.deeperScanAttempted && !meta.deeperScanAvailable
      ),
      reason: reasonText(meta.featureAvailability?.deeperScan),
    },
    {
      key: 'competitors',
      status: statusFromAvailability(
        meta.featureAvailability?.competitors,
        meta.competitorAnalysisAvailable,
        meta.competitorAnalysisAttempted && !meta.competitorAnalysisAvailable
      ),
      reason: reasonText(meta.featureAvailability?.competitors),
    },
    {
      key: 'email',
      status: statusFromAvailability(
        emailAvailability,
        meta.emailReportStatus === 'sent',
        meta.emailReportStatus === 'pending' || meta.emailReportStatus === 'failed'
      ),
      reason: reasonText(emailAvailability),
    },
    {
      key: 'lead',
      status: statusFromAvailability(
        leadAvailability,
        meta.leadCaptureStatus === 'captured' || meta.leadCaptureStatus === 'deduped',
        meta.leadCaptureStatus === 'failed'
      ),
      reason: reasonText(leadAvailability),
    },
  ];
  const visibleReasons = items.filter(item => item.reason && item.status !== 'active');

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-surface-200 bg-surface-50'
      }`}
    >
      <p className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-surface-900'}`}>
        {t('title')}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const style = statusStyles[item.status];
          const Icon = style.icon;
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.className}`}
              title={t(`items.${item.key}.hint` as 'items.lighthouse.hint')}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{t(`items.${item.key}.label` as 'items.lighthouse.label')}</span>
              <span className="opacity-70">
                · {t(`status.${style.labelKey}` as 'status.active')}
              </span>
            </span>
          );
        })}
      </div>
      {visibleReasons.length > 0 && (
        <div className={`mt-3 space-y-1 text-xs ${isDark ? 'text-white/55' : 'text-surface-500'}`}>
          {visibleReasons.map(item => (
            <p key={item.key}>
              <span className="font-medium">{t(`items.${item.key}.label` as 'items.lighthouse.label')}:</span>{' '}
              {item.reason}
            </p>
          ))}
        </div>
      )}
      {meta.cached && (
        <p className={`mt-3 text-xs ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
          {t('cachedNote')}
        </p>
      )}
    </div>
  );
}
