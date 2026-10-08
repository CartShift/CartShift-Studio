'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2, Sparkles, FileCheck2 } from 'lucide-react';
import {
  calculateEstimate,
  emptyProposalContent,
  shopifyProjectTemplate,
  type ProposalContent,
  type ProposalRequirement,
  type ProposalScopeItem,
} from '@/lib/domain/proposal-content';
import { CURRENCY_CONFIG, type Currency } from '@/lib/types/pricing';

type Props = {
  value?: ProposalContent;
  onChange: (value: ProposalContent) => void;
  onTemplateApplied?: () => void;
  currency: Currency;
};

const id = () => (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `item_${Date.now()}_${Math.random().toString(36).slice(2)}`);
const numeric = (value: string) => value === '' ? undefined : Number(value);
const lines = (value: string) => value.split('\n').filter(s => s.length > 0);
const commonInput = 'w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-white';
const labelClass = 'mb-1 block text-xs font-semibold text-surface-600 dark:text-surface-300';
const sectionClass = 'space-y-4 rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-950';

export function ProposalContentEditor({ value, onChange, onTemplateApplied, currency }: Props) {
  const t = useTranslations('portal.proposalBuilder');
  const content = value ?? emptyProposalContent();
  const change = (patch: Partial<ProposalContent>) => onChange({ ...content, ...patch });
  const changePricing = (patch: Partial<ProposalContent['pricing']>) =>
    change({ pricing: { ...content.pricing, ...patch } });
  const editScope = (index: number, patch: Partial<ProposalScopeItem>) =>
    change({ scope: content.scope.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const editRequirement = (index: number, patch: Partial<ProposalRequirement>) =>
    change({ requirements: content.requirements.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const estimate = calculateEstimate(content);
  const format = (amount: number) =>
    `${CURRENCY_CONFIG[currency].symbol}${(amount / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">{t('title')}</h2>
          <p className="mt-1 text-sm text-surface-500">{t('preview')}</p>
        </div>
        <button type="button" onClick={() => { onChange(shopifyProjectTemplate()); onTemplateApplied?.(); }}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary-300 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-950">
          <Sparkles size={16}/>{t('template')}
        </button>
      </div>

      <section className={sectionClass}>
        <label htmlFor="proposal-objective" className={labelClass}>{t('objective')}</label>
        <textarea id="proposal-objective" rows={3} className={commonInput}
          placeholder={t('objectiveHint')} value={content.objective}
          onChange={e => change({ objective: e.target.value })}/>
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-surface-900 dark:text-white">{t('scope')}</h3>
          <button type="button" onClick={() => change({ scope: [...content.scope, { id: id(), title: '', description: '' }] })}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950">
            <Plus size={16}/>{t('addScope')}
          </button>
        </div>
        {content.scope.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-surface-600 dark:text-surface-300">{index + 1}</span>
              <button type="button" aria-label={t('remove')} onClick={() => change({ scope: content.scope.filter(s => s.id !== item.id) })}
                className="rounded-lg p-2 text-surface-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                <Trash2 size={17}/>
              </button>
            </div>
            <label className={labelClass}>{t('itemTitle')}
              <input value={item.title} onChange={e => editScope(index, { title: e.target.value })} className={commonInput}/>
            </label>
            <label className={labelClass}>{t('itemDescription')}
              <textarea rows={3} value={item.description} onChange={e => editScope(index, { description: e.target.value })} className={commonInput}/>
            </label>
            <label className={labelClass}>{t('deliverable')}
              <input value={item.deliverable ?? ''} onChange={e => editScope(index, { deliverable: e.target.value })} className={commonInput}/>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>{t('minHours')}
                <input type="number" min="0" step=".25" value={item.hoursMin ?? ''} onChange={e => editScope(index, { hoursMin: numeric(e.target.value) })} className={commonInput}/>
              </label>
              <label className={labelClass}>{t('maxHours')}
                <input type="number" min="0" step=".25" value={item.hoursMax ?? ''} onChange={e => editScope(index, { hoursMax: numeric(e.target.value) })} className={commonInput}/>
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-surface-900 dark:text-white">{t('requirements')}</h3>
          <button type="button" onClick={() => change({ requirements: [...content.requirements, { id: id(), title: '', required: true }] })}
            className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary-600 hover:underline">
            <Plus size={16}/>{t('addRequirement')}
          </button>
        </div>
        {content.requirements.map((req, index) => (
          <div key={req.id} className="grid gap-2 rounded-xl bg-surface-50 p-3 dark:bg-surface-900">
            <div className="flex gap-2">
              <input aria-label={t('requirementTitle')} className={commonInput} placeholder={t('requirementTitle')}
                value={req.title} onChange={e => editRequirement(index, { title: e.target.value })}/>
              <button type="button" aria-label={t('remove')} className="rounded-lg p-2 text-surface-500 hover:text-red-600"
                onClick={() => change({ requirements: content.requirements.filter(r => r.id !== req.id) })}><Trash2 size={16}/></button>
            </div>
            <input className={commonInput} aria-label={t('requirementDetails')} placeholder={t('requirementDetails')}
              value={req.details ?? ''} onChange={e => editRequirement(index, { details: e.target.value })}/>
            <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
              <input type="checkbox" checked={req.required} onChange={e => editRequirement(index, { required: e.target.checked })}/>
              {t('required')}
            </label>
          </div>
        ))}
      </section>

      <section className={sectionClass}>
        {(['deliverables', 'assumptions', 'exclusions'] as const).map(field => (
          <label key={field} className="block">
            <span className={labelClass}>{t(field)}</span>
            <textarea rows={3} className={commonInput} placeholder={t('onePerLine')}
              value={content[field].join('\n')}
              onChange={e => change({ [field]: lines(e.target.value) })}/>
          </label>
        ))}
      </section>

      <section className={sectionClass}>
        <h3 className="flex items-center gap-2 font-semibold text-surface-900 dark:text-white"><FileCheck2 size={18}/>{t('pricing')}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={labelClass}>{t('pricing')}
            <select className={commonInput} value={content.pricing.mode} onChange={e => changePricing({ mode: e.target.value as ProposalContent['pricing']['mode'] })}>
              <option value="fixed">{t('fixed')}</option>
              <option value="hourly_estimate">{t('hourly_estimate')}</option>
              <option value="hourly_capped">{t('hourly_capped')}</option>
            </select>
          </label>
          <label className={labelClass}>{t('depositPercent')}
            <input type="number" min="0" max="100" step="1" className={commonInput}
              value={content.pricing.depositPercent} onChange={e => changePricing({ depositPercent: Number(e.target.value) })}/>
          </label>
          {content.pricing.mode !== 'fixed' && <>
            <label className={labelClass}>{t('hourlyRate')}
              <input type="number" min="0" step=".01" className={commonInput}
                value={(content.pricing.hourlyRateMinor ?? 0) / 100}
                onChange={e => changePricing({ hourlyRateMinor: Math.round(Number(e.target.value) * 100) })}/>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>{t('hoursMin')}
                <input type="number" min="0" step=".25" className={commonInput}
                  value={content.pricing.hoursMin ?? ''} onChange={e => changePricing({ hoursMin: numeric(e.target.value) })}/>
              </label>
              <label className={labelClass}>{t('hoursMax')}
                <input type="number" min="0" step=".25" className={commonInput}
                  value={content.pricing.hoursMax ?? ''} onChange={e => changePricing({ hoursMax: numeric(e.target.value) })}/>
              </label>
            </div>
          </>}
        </div>
        {estimate && <p className="text-sm text-surface-700 dark:text-surface-300">{t('estimatedRange')}: <strong>{format(estimate.minMinor)}–{format(estimate.maxMinor)}</strong></p>}
        <p className="text-xs text-surface-500">{t('capInfo')}</p>
      </section>

      <section className={sectionClass}>
        <h3 className="font-semibold text-surface-900 dark:text-white">{t('schedule')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['minBusinessDays', 'maxBusinessDays'] as const).map(field => (
            <label key={field} className={labelClass}>{t(field)}
              <input type="number" min="0" step="1" className={commonInput}
                value={content.schedule?.[field] ?? ''}
                onChange={e => change({ schedule: { ...content.schedule, [field]: numeric(e.target.value) } })}/>
            </label>
          ))}
        </div>
        <label className={labelClass}>{t('startsAfter')}
          <input className={commonInput} value={content.schedule?.startsAfter ?? ''}
            onChange={e => change({ schedule: { ...content.schedule, startsAfter: e.target.value } })}/>
        </label>
        <label className={labelClass}>{t('paymentTerms')}
          <textarea rows={3} className={commonInput} value={content.paymentTerms ?? ''}
            onChange={e => change({ paymentTerms: e.target.value })}/>
        </label>
      </section>
    </div>
  );
}
