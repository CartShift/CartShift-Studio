'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { CURRENCY_CONFIG, type Currency, formatCurrency } from '@/lib/types/pricing';

export interface ProposalEditorRow {
  key: string;
  /** Persisted line item identity is required in edit mode, but not create mode. */
  idRegistration?: UseFormRegisterReturn;
  descriptionRegistration: UseFormRegisterReturn;
  pricingTypeRegistration: UseFormRegisterReturn;
  quantityRegistration: UseFormRegisterReturn;
  unitPriceRegistration: UseFormRegisterReturn;
  descriptionError?: string;
  quantityError?: string;
  priceError?: string;
}

interface ProposalLineItemsCardProps {
  rows: ProposalEditorRow[];
  currency: Currency;
  pricingTypeOptions: SelectOption[];
  subtitle?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  includeTaxRegistration: UseFormRegisterReturn;
  lineItemsError?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/**
 * Reusable proposal editor for creation and editing. The parent owns form
 * state, business rules and persistence; this component only renders rows.
 */
export function ProposalLineItemsCard({
  rows,
  currency,
  pricingTypeOptions,
  subtitle,
  subtotal,
  taxAmount,
  totalAmount,
  includeTaxRegistration,
  lineItemsError,
  onAdd,
  onRemove,
}: ProposalLineItemsCardProps) {
  const t = useTranslations('portal');
  return (
    <Card padding="none">
      <div className="p-6 pb-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-outfit text-lg font-bold text-surface-900 dark:text-white">
              {t('pricing.form.lineItems')}
            </h3>
            {subtitle && <p className="mt-1 text-xs text-surface-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="portal-focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold text-primary-600 transition-all hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/20"
          >
            <Plus size={16} aria-hidden />
            {t('pricing.form.addItem')}
          </button>
        </div>
      </div>

      <div className="space-y-3 px-6">
        <div aria-hidden="true" className="hidden grid-cols-12 gap-3 px-1 text-xs font-bold uppercase tracking-wider text-surface-400 sm:grid">
          <div className="col-span-5 md:col-span-6">{t('pricing.form.itemDescription')}</div>
          <div className="col-span-2 text-center">{t('pricing.form.quantity')}</div>
          <div className="col-span-3 md:col-span-2">{t('pricing.form.unitPrice')}</div>
          <div className="col-span-2" />
        </div>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="flex flex-col items-start gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-900/50 sm:grid sm:grid-cols-12"
          >
            {row.idRegistration && <input type="hidden" {...row.idRegistration} />}
            <div className="w-full sm:col-span-5 md:col-span-6">
              <label className="mb-1 block text-xs font-semibold text-surface-500 sm:hidden">
                {t('pricing.form.itemDescription')}
              </label>
              <Input
                {...row.descriptionRegistration}
                type="text"
                placeholder="Service or product..."
                error={row.descriptionError}
                className="text-sm"
              />
              <Select
                {...row.pricingTypeRegistration}
                options={pricingTypeOptions}
                className="mt-2 text-xs"
                aria-label={t('pricing.form.lineItems')}
              />
            </div>
            <div className="flex w-full gap-3 sm:contents">
              <div className="min-w-0 flex-1 sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-surface-500 sm:hidden">
                  {t('pricing.form.quantity')}
                </label>
                <Input
                  {...row.quantityRegistration}
                  type="number"
                  min={1}
                  error={row.quantityError}
                  className="text-center text-sm"
                  aria-label={t('pricing.form.quantity')}
                />
              </div>
              <div className="min-w-0 flex-1 sm:col-span-3 md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-surface-500 sm:hidden">
                  {t('pricing.form.unitPrice')}
                </label>
                <Input
                  {...row.unitPriceRegistration}
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  error={row.priceError}
                  leftIcon={<span className="text-sm">{CURRENCY_CONFIG[currency]?.symbol || '$'}</span>}
                  className="text-sm"
                  aria-label={t('pricing.form.unitPrice')}
                />
              </div>
              <div className="flex items-end justify-end sm:col-span-2 sm:items-start">
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label={t('common.delete')}
                    className="portal-focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {lineItemsError && (
          <p role="alert" className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle size={14} aria-hidden />
            {lineItemsError}
          </p>
        )}
      </div>

      <div className="mx-6 mt-6 space-y-3 border-t border-surface-200 pt-6 dark:border-surface-800">
        <div className="flex items-center justify-between text-sm text-surface-500">
          <span>{t('pricing.form.subtotal')}</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-surface-500">
          <div className="flex items-center gap-2">
            <label htmlFor="proposal-include-tax">{t('pricing.form.tax')}</label>
            <input
              id="proposal-include-tax"
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary-600 focus-visible:ring-primary-500/40"
              {...includeTaxRegistration}
            />
          </div>
          <span>{formatCurrency(taxAmount, currency)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-800/50">
          <span className="text-lg font-bold text-surface-700 dark:text-surface-300">
            {t('pricing.form.total')}
          </span>
          <span className="font-outfit text-2xl font-black text-surface-900 dark:text-white">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      </div>
    </Card>
  );
}
