'use client';
import { useTranslations } from 'next-intl';
import { PaymentRecord, formatCurrency } from '@/lib/types/portal';

export function PaymentHistory({ payments }: { payments: PaymentRecord[] }) {
  const t = useTranslations('portal.invoices');
  if (!payments.length) return null;
  return <div className="space-y-2"><p className="text-xs font-black uppercase tracking-widest text-surface-400">{t('history')}</p>{payments.map(payment => <div key={payment.id} className="rounded-xl bg-surface-50 p-3 text-xs dark:bg-surface-900"><div className="flex justify-between gap-3"><span className="font-bold text-surface-900 dark:text-white">{t(`methods.${payment.method}`)}</span><span className="font-black text-emerald-600">{formatCurrency(payment.amount, payment.currency)}</span></div><p className="mt-1 text-surface-500">{payment.paidAt.toDate().toLocaleDateString()}{payment.reference ? ` · ${payment.reference}` : ''}{payment.isLegacy ? ` · ${t('legacy')}` : ''}</p></div>)}</div>;
}
