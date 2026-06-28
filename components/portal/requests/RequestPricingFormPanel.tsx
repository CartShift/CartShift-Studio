'use client';

import { Plus, Check, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { IconButton } from '@/components/ui/IconButton';
import { PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import { CURRENCY_CONFIG, Currency, PricingLineItem, formatCurrency } from '@/lib/types/portal';

interface RequestPricingFormPanelProps {
  lineItems: PricingLineItem[];
  currency: Currency;
  taxRate: number;
  paymentDueAt: string;
  totalAmount: number;
  isValid: boolean;
  isSubmitting: boolean;
  onCurrencyChange: (currency: Currency) => void;
  onTaxRateChange: (rate: number) => void;
  onPaymentDueAtChange: (date: string) => void;
  onUpdateLineItem: (
    id: string,
    field: keyof PricingLineItem,
    value: string | number
  ) => void;
  onRemoveLineItem: (id: string) => void;
  onAddLineItem: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function RequestPricingFormPanel({
  lineItems,
  currency,
  taxRate,
  paymentDueAt,
  totalAmount,
  isValid,
  isSubmitting,
  onCurrencyChange,
  onTaxRateChange,
  onPaymentDueAtChange,
  onUpdateLineItem,
  onRemoveLineItem,
  onAddLineItem,
  onSubmit,
  onCancel,
}: RequestPricingFormPanelProps) {
  const t = useTranslations('portal');

  const currencyOptions = Object.entries(CURRENCY_CONFIG).map(([key, config]) => ({
    value: key,
    label: `${config.symbol} ${config.name}`,
  }));

  return (
    <div className="space-y-4">
      <PortalFormGrid className="md:grid-cols-2">
        <Select
          label={t('requests.detail.currency')}
          value={currency}
          onChange={e => onCurrencyChange(e.target.value as Currency)}
          options={currencyOptions}
        />
        <Input
          label={t('requests.detail.taxRate')}
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={taxRate * 100}
          onChange={e => onTaxRateChange(Number(e.target.value || 0) / 100)}
        />
        <Input
          label={t('requests.detail.paymentDueAt')}
          type="date"
          value={paymentDueAt}
          onChange={e => onPaymentDueAtChange(e.target.value)}
          className="md:col-span-2"
        />
      </PortalFormGrid>

      <div className="space-y-3">
        <p className="text-xs font-bold text-surface-500">{t('requests.detail.lineItems')}</p>
        {lineItems.map(item => (
          <div
            key={item.id}
            className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg space-y-2"
          >
            <Input
              placeholder={t('requests.detail.descriptionPlaceholder')}
              value={item.description}
              onChange={e => onUpdateLineItem(item.id, 'description', e.target.value)}
            />
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="1"
                placeholder={t('requests.detail.qty')}
                value={item.quantity || ''}
                onChange={e =>
                  onUpdateLineItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)
                }
                className="flex-1"
              />
              <span className="text-surface-400 text-sm">×</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={t('requests.detail.price')}
                leftIcon={
                  <span className="text-surface-400 text-sm">
                    {CURRENCY_CONFIG[currency].symbol}
                  </span>
                }
                value={item.unitPrice ? (item.unitPrice / 100).toFixed(2) : ''}
                onChange={e =>
                  onUpdateLineItem(
                    item.id,
                    'unitPrice',
                    Math.round(parseFloat(e.target.value || '0') * 100)
                  )
                }
                className="flex-1"
              />
              {lineItems.length > 1 ? (
                <IconButton
                  icon={Trash2}
                  label={t('common.delete')}
                  variant="danger"
                  size="sm"
                  onClick={() => onRemoveLineItem(item.id)}
                />
              ) : null}
            </div>
            {item.quantity > 0 && item.unitPrice >= 0 && item.unitPrice !== undefined ? (
              <div className="text-end text-xs font-bold text-surface-500">
                = {formatCurrency(item.unitPrice * item.quantity, currency)}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAddLineItem}
        className="w-full border-dashed"
        leftIcon={<Plus size={16} />}
      >
        {t('requests.detail.addLineItem')}
      </Button>

      {totalAmount > 0 ? (
        <div className="pt-3 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <span className="text-sm font-bold text-surface-600 dark:text-surface-400">
            {t('requests.detail.total')}
          </span>
          <span className="text-lg font-black text-surface-900 dark:text-white font-outfit">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      ) : null}

      <div className="pt-3 flex gap-2">
        <Button variant="outline" className="flex-1 h-10" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          className="flex-1 h-10"
          onClick={onSubmit}
          disabled={isSubmitting || !isValid}
          loading={isSubmitting}
          leftIcon={!isSubmitting ? <Check size={16} /> : undefined}
        >
          {t('requests.detail.sendQuote')}
        </Button>
      </div>
    </div>
  );
}
