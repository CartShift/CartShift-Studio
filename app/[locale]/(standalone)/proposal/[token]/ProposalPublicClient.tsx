'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PublicProposalSummary } from '@/components/proposals/PublicProposalSummary';
import { ProposalPaymentCheckout } from '@/components/proposals/ProposalPaymentCheckout';
import {
  acceptPricingRequestWithSignature,
  getPricingRequestByPublicToken,
} from '@/lib/services/pricing-requests';
import { PublicPricingProposal } from '@/lib/types/pricing';

export default function ProposalPublicClient({ token }: { token: string }) {
  const t = useTranslations('proposal');
  const [proposal, setProposal] = useState<PublicPricingProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedByName, setAcceptedByName] = useState('');
  const [acceptedByEmail, setAcceptedByEmail] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const load = useCallback(async () => {
    try {
      setProposal(await getPricingRequestByPublicToken(token));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('error'));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      setProposal(
        await acceptPricingRequestWithSignature(token, {
          termsAccepted,
          acceptedByName,
          acceptedByEmail: acceptedByEmail || undefined,
          signatureText,
        })
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-950 p-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="font-outfit text-2xl font-black">{t('notFound')}</h1>
          <p className="mt-2 text-surface-400">{error}</p>
        </div>
      </main>
    );
  }

  const deposit = proposal.payments.find(payment => payment.type === 'deposit' && payment.status !== 'canceled');
  const isAccepted = proposal.status === 'ACCEPTED' || proposal.status === 'PAID';

  return (
    <main className="min-h-screen bg-surface-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {proposal.isPreview && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            {t('preview')}
          </div>
        )}
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 sm:p-8">
          <PublicProposalSummary proposal={proposal} />
        </div>

        {isAccepted ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
              <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              <h2 className="mt-3 font-outfit text-xl font-black">{t('accepted.title')}</h2>
              <p className="mt-1 text-sm text-emerald-100/80">{t('accepted.description')}</p>
            </div>
            {deposit && deposit.status !== 'paid' && (
              <ProposalPaymentCheckout
                payment={deposit}
                proposalToken={token}
                onPaid={load}
              />
            )}
          </div>
        ) : proposal.canAccept ? (
          <form
            onSubmit={submit}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8"
          >
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-6 w-6 text-primary-300" />
              <h2 className="font-outfit text-xl font-black">{t('approve.title')}</h2>
            </div>
            <p className="mt-2 text-sm text-surface-300">{t('approve.description')}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-surface-200">
                {t('approve.fullName')}
                <input className="portal-input mt-2 w-full" required value={acceptedByName} onChange={event => setAcceptedByName(event.target.value)} />
              </label>
              <label className="text-sm font-bold text-surface-200">
                {t('approve.email')}
                <input className="portal-input mt-2 w-full" type="email" value={acceptedByEmail} onChange={event => setAcceptedByEmail(event.target.value)} />
              </label>
            </div>
            <label className="mt-4 block text-sm font-bold text-surface-200">
              {t('approve.signature')}
              <input className="portal-input mt-2 w-full font-outfit text-lg" required value={signatureText} onChange={event => setSignatureText(event.target.value)} />
            </label>
            <label className="mt-5 flex items-start gap-3 text-sm text-surface-300">
              <input className="mt-1 h-4 w-4 rounded border-white/20" type="checkbox" checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} required />
              <span>{t('approve.checkbox')}</span>
            </label>
            {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
            <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary-500 px-5 py-3 font-outfit font-black text-white transition-colors hover:bg-primary-400 disabled:opacity-50" disabled={submitting} type="submit">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t('approve.submit')}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-surface-300">
            {t('unavailable')}
          </div>
        )}
      </div>
    </main>
  );
}
