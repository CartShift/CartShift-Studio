'use client';
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import {
  BillingProfile,
  Organization,
  PaymentRecord,
  Request,
  formatCurrency,
} from '@/lib/types/portal';
import { InvoiceDownloadButton } from '@/components/portal/invoices/InvoiceDownloadButton';
import { ManualPaymentForm } from './ManualPaymentForm';
import { PaymentHistory } from './PaymentHistory';

export function PaymentSummaryCard({
  request,
  organization,
  profile,
  payments,
  isAgency,
  recordPayment,
  recording,
  paypal,
}: {
  request: Request;
  organization: Organization;
  profile?: BillingProfile | null;
  payments: PaymentRecord[];
  isAgency: boolean;
  recordPayment: Parameters<typeof ManualPaymentForm>[0]['submit'];
  recording: boolean;
  paypal?: ReactNode;
}) {
  const t = useTranslations('portal.invoices');
  const currency = request.currency ?? 'USD';
  const subtotal =
    request.subtotal ??
    request.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ??
    0;
  const rate = request.taxRate ?? profile?.defaultTaxRate ?? 0;
  const tax = request.taxAmount ?? Math.round(subtotal * rate);
  const total = request.totalAmount ?? subtotal + tax;
  const paid = request.amountPaid ?? payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, request.balanceDue ?? total - paid);
  const status =
    request.paymentStatus ??
    (paid >= total && total > 0 ? 'paid' : paid ? 'partially_paid' : 'unpaid');
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-surface-200 p-3 text-sm dark:border-surface-800">
        <div className="flex justify-between">
          <span>{t('subtotal')}</span>
          <b>{formatCurrency(subtotal, currency)}</b>
        </div>
        <div className="flex justify-between">
          <span>
            {t('tax')} ({(rate * 100).toFixed(2)}%)
          </span>
          <b>{formatCurrency(tax, currency)}</b>
        </div>
        <div className="flex justify-between border-t border-surface-200 pt-2 dark:border-surface-800">
          <span>{t('total')}</span>
          <b>{formatCurrency(total, currency)}</b>
        </div>
        <div className="flex justify-between">
          <span>{t('amountPaid')}</span>
          <b className="text-emerald-600">{formatCurrency(paid, currency)}</b>
        </div>
        <div className="flex justify-between">
          <span>{t('balanceDue')}</span>
          <b>{formatCurrency(balance, currency)}</b>
        </div>
        <div className="flex justify-between">
          <span>{t('status')}</span>
          <Badge
            variant={status === 'paid' ? 'green' : status === 'partially_paid' ? 'yellow' : 'gray'}
          >
            {t(`statuses.${status}`)}
          </Badge>
        </div>
      </div>
      <div className="grid gap-2">
        {status === 'paid' ? (
          <>
            <InvoiceDownloadButton
              request={request}
              organization={organization}
              billingProfile={profile}
              payments={payments}
              documentType="payment_receipt"
              className="w-full"
            />
            <InvoiceDownloadButton
              request={request}
              organization={organization}
              billingProfile={profile}
              payments={payments}
              documentType="paid_invoice"
              className="w-full"
            />
          </>
        ) : (
          <InvoiceDownloadButton
            request={request}
            organization={organization}
            billingProfile={profile}
            payments={payments}
            documentType={status === 'partially_paid' ? 'invoice' : 'payment_request'}
            className="w-full"
          />
        )}
      </div>
      {paypal}
      {isAgency && balance > 0 && !request.paymentRequired && (
        <ManualPaymentForm
          balanceDue={balance}
          currency={currency}
          submit={recordPayment}
          loading={recording}
        />
      )}
      {request.paymentRequired && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          {t('proposalManaged')}
        </p>
      )}
      <PaymentHistory payments={payments} />
    </div>
  );
}
