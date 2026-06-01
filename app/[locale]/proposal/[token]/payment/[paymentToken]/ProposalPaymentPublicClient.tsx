'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ProposalPaymentCheckout } from '@/components/proposals/ProposalPaymentCheckout';
import { PublicProposalSummary } from '@/components/proposals/PublicProposalSummary';
import { getPublicProposalPayment } from '@/lib/services/proposal-api';
import { PublicPricingProposal, PublicProposalPayment } from '@/lib/types/pricing';

export default function ProposalPaymentPublicClient({
  token,
  paymentToken,
}: {
  token: string;
  paymentToken: string;
}) {
  const [data, setData] = useState<{
    proposal: PublicPricingProposal;
    payment: PublicProposalPayment;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getPublicProposalPayment(token, paymentToken));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Payment request not found');
    }
  }, [paymentToken, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-950 p-6 text-white">
        {error ? <p>{error}</p> : <Loader2 className="h-8 w-8 animate-spin text-primary-400" />}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8">
          <PublicProposalSummary proposal={data.proposal} />
        </div>
        <ProposalPaymentCheckout
          payment={data.payment}
          proposalToken={token}
          onPaid={load}
        />
      </div>
    </main>
  );
}
