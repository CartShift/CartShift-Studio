'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Copy, CreditCard, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useProposalPayments } from '@/lib/hooks/useProposalPayments';
import { formatCurrency, ManualPaymentMethod, PricingRequest } from '@/lib/types/pricing';

export function ProposalPaymentPanel({
  proposal,
  locale,
}: {
  proposal: PricingRequest;
  locale: string;
}) {
  const t = useTranslations('portal.pricing.proposalPayments');
  const [publicToken, setPublicToken] = useState(proposal.publicToken || '');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState<ManualPaymentMethod>('bank_transfer');
  const [manualReference, setManualReference] = useState('');
  const [manualNote, setManualNote] = useState('');
  const isAccepted = proposal.status === 'ACCEPTED';
  const { payments, loading, issueLink, createInstallment, cancelInstallment, recordManualPayment } =
    useProposalPayments(proposal.id, true);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://cart-shift.com');
  const proposalUrl = publicToken ? `${baseUrl}/${locale}/proposal/${publicToken}` : '';
  const pendingTotal = useMemo(
    () =>
      payments
        .filter(payment => payment.status === 'pending')
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );
  const available = Math.max(0, (proposal.balanceDue ?? proposal.totalAmount) - pendingTotal);

  const ensureToken = async () => {
    if (publicToken) return publicToken;
    const token = await issueLink.mutateAsync();
    setPublicToken(token);
    return token;
  };

  const submitManualPayment = async (event: FormEvent) => {
    event.preventDefault();
    await recordManualPayment.mutateAsync({
      label: t('manualLabel'),
      amount: Math.round(Number(manualAmount) * 100),
      method: manualMethod,
      reference: manualReference || undefined,
      note: manualNote || undefined,
    });
    setManualAmount('');
    setManualReference('');
    setManualNote('');
  };

  const copyProposalLink = async () => {
    const token = await ensureToken();
    await navigator.clipboard.writeText(`${baseUrl}/${locale}/proposal/${token}`);
    toast.success(t('publicLinkCopied'));
  };

  const copyPaymentLink = async (paymentToken: string) => {
    const token = await ensureToken();
    await navigator.clipboard.writeText(
      `${baseUrl}/${locale}/proposal/${token}/payment/${paymentToken}`
    );
    toast.success(t('paymentLinkCopied'));
  };

  const submitInstallment = async (event: FormEvent) => {
    event.preventDefault();
    const amountInCents = Math.round(Number(amount) * 100);
    await createInstallment.mutateAsync({
      label,
      amount: amountInCents,
      dueAt: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : undefined,
    });
    setLabel('');
    setAmount('');
    setDueAt('');
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-outfit text-lg font-bold text-surface-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {t('description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copyProposalLink} loading={issueLink.isPending}>
          <Copy size={15} />
          {t('copyPublicLink')}
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-900">
          <p className="text-xs font-black uppercase tracking-widest text-surface-400">{t('paid')}</p>
          <p className="mt-1 font-outfit text-lg font-black text-emerald-600">
            {formatCurrency(proposal.amountPaid ?? 0, proposal.currency)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-900">
          <p className="text-xs font-black uppercase tracking-widest text-surface-400">{t('balance')}</p>
          <p className="mt-1 font-outfit text-lg font-black text-surface-900 dark:text-white">
            {formatCurrency(proposal.balanceDue ?? proposal.totalAmount, proposal.currency)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-900">
          <p className="text-xs font-black uppercase tracking-widest text-surface-400">{t('available')}</p>
          <p className="mt-1 font-outfit text-lg font-black text-surface-900 dark:text-white">
            {formatCurrency(available, proposal.currency)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        ) : payments.length === 0 ? (
          <p className="text-sm text-surface-500">{t('empty')}</p>
        ) : (
          payments.map(payment => (
            <div
              key={payment.id}
              className="flex flex-col gap-3 rounded-xl border border-surface-200 p-3 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-primary-500" />
                <div>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{payment.label}</p>
                  <p className="text-xs text-surface-500">
                    {formatCurrency(payment.amount, payment.currency)} · {payment.status} ·{' '}
                    {payment.provider === 'manual'
                      ? t(`manualMethods.${payment.manualMethod || 'other'}`)
                      : 'PayPal'}
                  </p>
                  {payment.manualReference && (
                    <p className="mt-1 text-xs text-surface-400">
                      {t('reference')}: {payment.manualReference}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {payment.provider === 'paypal' &&
                  (payment.status === 'pending' || payment.status === 'failed') && (
                    <Button variant="outline" size="xs" onClick={() => copyPaymentLink(payment.paymentToken)}>
                      <Copy size={13} />
                      {t('copyLink')}
                    </Button>
                  )}
                {(payment.status === 'pending' || payment.status === 'failed') && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => cancelInstallment.mutate(payment.id)}
                    disabled={cancelInstallment.isPending}
                  >
                    <X size={13} />
                    {t('cancel')}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAccepted && available > 0 && (
        <form onSubmit={submitInstallment} className="mt-6 grid gap-3 border-t border-surface-200 pt-5 dark:border-surface-800 sm:grid-cols-3">
          <input
            className="portal-input"
            placeholder={t('labelPlaceholder')}
            value={label}
            onChange={event => setLabel(event.target.value)}
            required
          />
          <input
            className="portal-input"
            type="number"
            min={0.01}
            max={available / 100}
            step={0.01}
            placeholder={t('amountPlaceholder')}
            value={amount}
            onChange={event => setAmount(event.target.value)}
            required
          />
          <input className="portal-input" type="date" value={dueAt} onChange={event => setDueAt(event.target.value)} />
          <Button className="sm:col-span-3" type="submit" loading={createInstallment.isPending}>
            <Plus size={15} />
            {t('create')}
          </Button>
        </form>
      )}

      {isAccepted && (proposal.balanceDue ?? proposal.totalAmount) > 0 && (
        <form
          onSubmit={submitManualPayment}
          className="mt-6 grid gap-3 border-t border-surface-200 pt-5 dark:border-surface-800 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h3 className="font-outfit text-sm font-black text-surface-900 dark:text-white">
              {t('recordManual')}
            </h3>
            <p className="mt-1 text-xs text-surface-500">{t('recordManualDescription')}</p>
          </div>
          <input
            className="portal-input"
            type="number"
            min={0.01}
            max={(proposal.balanceDue ?? proposal.totalAmount) / 100}
            step={0.01}
            placeholder={t('amountPlaceholder')}
            value={manualAmount}
            onChange={event => setManualAmount(event.target.value)}
            required
          />
          <select
            className="portal-input"
            value={manualMethod}
            onChange={event => setManualMethod(event.target.value as ManualPaymentMethod)}
          >
            {(['bank_transfer', 'cash', 'bit', 'paybox', 'check', 'credit_card_manual', 'other'] as const).map(method => (
              <option key={method} value={method}>
                {t(`manualMethods.${method}`)}
              </option>
            ))}
          </select>
          <input
            className="portal-input"
            placeholder={t('referencePlaceholder')}
            value={manualReference}
            onChange={event => setManualReference(event.target.value)}
          />
          <input
            className="portal-input"
            placeholder={t('notePlaceholder')}
            value={manualNote}
            onChange={event => setManualNote(event.target.value)}
          />
          <Button className="sm:col-span-2" type="submit" loading={recordManualPayment.isPending}>
            {t('recordManual')}
          </Button>
        </form>
      )}

      {proposalUrl && <p className="mt-4 break-all text-xs text-surface-400">{proposalUrl}</p>}
    </Card>
  );
}
