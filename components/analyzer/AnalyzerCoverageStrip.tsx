'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { AnalysisMeta } from '@/lib/types/analyzer';

type CoverageStatus = 'active' | 'partial' | 'unavailable';

function resolveStatus(active: boolean, partial?: boolean): CoverageStatus {
  if (active) return 'active';
  if (partial) return 'partial';
  return 'unavailable';
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

  const items: { key: string; status: CoverageStatus }[] = [
    {
      key: 'lighthouse',
      status: resolveStatus(meta.usedLighthouse, !meta.usedLighthouse && meta.usedHtmlFallback),
    },
    {
      key: 'visual',
      status: resolveStatus(
        meta.visualAnalysisAvailable,
        meta.visualAnalysisAttempted && !meta.visualAnalysisAvailable
      ),
    },
    {
      key: 'product',
      status: resolveStatus(meta.productAnalysisAvailable),
    },
    {
      key: 'competitors',
      status: resolveStatus(meta.competitorAnalysisAvailable),
    },
    {
      key: 'email',
      status: resolveStatus(
        meta.emailReportStatus === 'sent',
        meta.emailReportStatus === 'pending' || meta.emailReportStatus === 'failed'
      ),
    },
  ];

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
      {meta.cached && (
        <p className={`mt-3 text-xs ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
          {t('cachedNote')}
        </p>
      )}
    </div>
  );
}
