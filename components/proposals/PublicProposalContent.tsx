'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, ClipboardList, Info } from 'lucide-react';
import { calculateEstimate, type ProposalContent } from '@/lib/domain/proposal-content';
import { CURRENCY_CONFIG, type Currency } from '@/lib/types/pricing';

export function PublicProposalContent({ content, currency, capMinor }: {
  content?: ProposalContent;
  currency: Currency;
  capMinor: number;
}) {
  const t = useTranslations('proposal');
  if (!content) return null;
  const estimate = calculateEstimate(content);
  const format = (amount: number) =>
    `${CURRENCY_CONFIG[currency].symbol}${(amount / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const hasScope = content.scope.length > 0;
  const panel = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5';
  return (
    <div className="space-y-7" data-proposal-structured>
      {content.objective && (
        <section aria-labelledby="proposal-objective">
          <h2 id="proposal-objective" className="text-lg font-bold text-white">{t('details.objective')}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-surface-300">{content.objective}</p>
        </section>
      )}
      {hasScope && (
        <section aria-labelledby="proposal-scope">
          <h2 id="proposal-scope" className="mb-3 text-lg font-bold text-white">{t('scope')}</h2>
          <div className="space-y-3">
            {content.scope.map((item, index) => (
              <div key={item.id} className={panel}>
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-primary-500/15 px-2.5 py-1 text-sm font-semibold text-primary-200">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    {item.description && <p className="mt-2 whitespace-pre-line text-sm leading-7 text-surface-300">{item.description}</p>}
                    {item.deliverable && <p className="mt-2 text-sm text-surface-300"><strong>{t('details.deliverable')}:</strong> {item.deliverable}</p>}
                    {item.hoursMin != null && item.hoursMax != null && <p className="mt-2 text-xs text-surface-400">{t('details.itemHours', { min: item.hoursMin, max: item.hoursMax })}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {content.deliverables.length > 0 && (
        <section aria-labelledby="proposal-deliverables" className={panel}>
          <h2 id="proposal-deliverables" className="font-bold text-white">{t('details.deliverables')}</h2>
          <ul className="mt-3 space-y-2">
            {content.deliverables.map((item, i) => <li key={i} className="flex gap-2 text-sm text-surface-300"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300"/>{item}</li>)}
          </ul>
        </section>
      )}
      {content.requirements.length > 0 && (
        <section aria-labelledby="proposal-requirements" className={panel}>
          <h2 id="proposal-requirements" className="flex items-center gap-2 font-bold text-white"><ClipboardList size={19}/>{t('details.requirements')}</h2>
          <ul className="mt-3 space-y-3">
            {content.requirements.map(req => <li key={req.id} className="text-sm text-surface-300">
              <span className="font-semibold text-white">{req.title}</span>{req.required ? ` · ${t('details.required')}` : ''}
              {req.details && <p className="mt-1 text-surface-400">{req.details}</p>}
            </li>)}
          </ul>
        </section>
      )}
      {estimate && (
        <section className={panel} aria-labelledby="proposal-estimate">
          <h2 id="proposal-estimate" className="font-bold text-white">{t('details.estimate')}</h2>
          <p className="mt-3 text-2xl font-black text-white">{format(estimate.minMinor)}–{format(estimate.maxMinor)}</p>
          <p className="mt-1 text-sm text-surface-300">{t('details.hours', { min: content.pricing.hoursMin ?? 0, max: content.pricing.hoursMax ?? 0 })}</p>
          {content.pricing.mode === 'hourly_capped' && <p className="mt-2 text-sm text-surface-300">{t('details.cap', { amount: format(capMinor) })}</p>}
        </section>
      )}
      {content.schedule?.minBusinessDays != null && content.schedule?.maxBusinessDays != null && (
        <section className={panel} aria-labelledby="proposal-schedule">
          <h2 id="proposal-schedule" className="font-bold text-white">{t('details.schedule')}</h2>
          <p className="mt-2 text-sm text-surface-300">{t('details.businessDays', { min: content.schedule.minBusinessDays, max: content.schedule.maxBusinessDays })}</p>
          {content.schedule.startsAfter && <p className="mt-2 text-sm text-surface-300">{t('details.after')}: {content.schedule.startsAfter}</p>}
        </section>
      )}
      {(content.assumptions.length > 0 || content.exclusions.length > 0) && (
        <section className={panel}>
          <h2 className="flex items-center gap-2 font-bold text-white"><Info size={18}/>{t('details.conditions')}</h2>
          {([{ key: 'assumptions', items: content.assumptions }, { key: 'exclusions', items: content.exclusions }] as const).map(group =>
            group.items.length > 0 && <div key={group.key} className="mt-3">
              <h3 className="text-sm font-semibold text-white">{t(`details.${group.key}`)}</h3>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-7 text-surface-300">
                {group.items.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}
      {content.paymentTerms && (
        <section className={panel} aria-labelledby="proposal-payment-terms">
          <h2 id="proposal-payment-terms" className="font-bold text-white">{t('details.paymentTerms')}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-surface-300">{content.paymentTerms}</p>
        </section>
      )}
    </div>
  );
}
