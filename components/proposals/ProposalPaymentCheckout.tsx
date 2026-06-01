'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { PayPalCheckoutButton } from '@/components/portal/PayPalCheckoutButton';
import { PayPalProvider } from '@/components/providers/PayPalProvider';
import { formatCurrency, PricingRequest, PublicProposalPayment } from '@/lib/types/pricing';
import { useTranslations } from 'next-intl';

export function ProposalPaymentCheckout({
  payment,
  proposalToken,
  onPaid,
}: {
  payment: PublicProposalPayment;
  proposalToken: string;
  onPaid?: () => void;
}) {
  const t = useTranslations('proposal');
  const [error, setError] = useState<string | null>(null);
  const [paypalAvailable, setPayPalAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/paypal/status')
      .then(response => response.json())
      .then((data: { available?: boolean }) => {
        if (active) setPayPalAvailable(data.available === true);
      })
      .catch(() => {
        if (active) setPayPalAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (payment.status === 'paid') {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-emerald-100">
        <CheckCircle2 className="mb-2 h-6 w-6" />
        <p className="font-bold">{t('payment.complete')}</p>
      </div>
    );
  }

  const pricingRequest = {
    id: payment.id,
    orgId: '',
    title: payment.label,
    lineItems: [],
    totalAmount: payment.amount,
    currency: payment.currency,
    status: 'ACCEPTED',
    createdBy: '',
    createdByName: '',
  } as unknown as PricingRequest;

  if (paypalAvailable === null) {
    return <Loader2 className="h-6 w-6 animate-spin text-primary-300" />;
  }

  if (!paypalAvailable) {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">
        {t('payment.unavailable')}
      </div>
    );
  }

  return (
    <PayPalProvider currency={payment.currency}>
      <div className="rounded-2xl border border-primary-400/30 bg-primary-500/10 p-5">
        <h2 className="font-outfit text-xl font-black text-white">{payment.label}</h2>
        <p className="mt-1 text-sm text-surface-300">
          {t('payment.amount', { amount: formatCurrency(payment.amount, payment.currency) })}
        </p>
        <div className="mt-5">
          <PayPalCheckoutButton
            pricingRequest={pricingRequest}
            proposalPayment={{ proposalToken, paymentToken: payment.paymentToken }}
            onSuccess={() => {
              setError(null);
              onPaid?.();
            }}
            onError={setError}
          />
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </div>
    </PayPalProvider>
  );
}
