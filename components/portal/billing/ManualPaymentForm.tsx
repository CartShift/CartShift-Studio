'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  PortalFormField,
  PortalFormGrid,
} from '@/components/portal/ui/PortalFormField';
import { Currency, PaymentMethod, formatCurrency } from '@/lib/types/portal';

const PAYMENT_METHODS = ['bank_transfer', 'paypal', 'bit', 'cash', 'other'] as const;

interface ManualPaymentFormProps {
  balanceDue: number;
  currency: Currency;
  submit: (input: {
    amount: number;
    method: Exclude<PaymentMethod, 'manual'>;
    reference?: string;
    notes?: string;
    paidAt?: string;
  }) => Promise<unknown>;
  loading: boolean;
}

export function ManualPaymentForm({
  balanceDue,
  currency,
  submit,
  loading,
}: ManualPaymentFormProps) {
  const t = useTranslations('portal.invoices');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Exclude<PaymentMethod, 'manual'>>('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents > balanceDue) {
      toast.error(t('validation.amount'));
      return;
    }
    try {
      await submit({
        amount: cents,
        method,
        reference: reference || undefined,
        notes: notes || undefined,
        paidAt: new Date(`${paidAt}T12:00:00`).toISOString(),
      });
      setAmount('');
      setReference('');
      setNotes('');
      toast.success(t('manual.recorded'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('manual.failed'));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-surface-200 p-4 dark:border-surface-800"
    >
      <div>
        <p className="text-sm font-black text-surface-900 dark:text-white">{t('manual.title')}</p>
        <p className="text-xs text-surface-500">
          {t('manual.max', { amount: formatCurrency(balanceDue, currency) })}
        </p>
      </div>

      <PortalFormGrid className="md:grid-cols-1">
        <Input
          label={t('amountPaid')}
          type="number"
          min="0.01"
          max={balanceDue / 100}
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
        <Select
          label={t('manual.methodLabel')}
          value={method}
          onChange={e => setMethod(e.target.value as Exclude<PaymentMethod, 'manual'>)}
          options={PAYMENT_METHODS.map(value => ({
            value,
            label: t(`methods.${value}`),
          }))}
        />
        <Input
          label={t('manual.paidAtLabel')}
          type="date"
          value={paidAt}
          onChange={e => setPaidAt(e.target.value)}
          required
        />
        <Input
          label={t('reference')}
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
        <PortalFormField label={t('notes')}>
          <Textarea
            placeholder={t('notes')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="min-h-20"
          />
        </PortalFormField>
      </PortalFormGrid>

      <Button type="submit" className="w-full" loading={loading}>
        {t('manual.action')}
      </Button>
    </form>
  );
}
