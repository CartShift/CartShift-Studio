'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LockKeyhole, Printer, MessageCircle, Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PublicProposalSummary } from '@/components/proposals/PublicProposalSummary';
import { ProposalPaymentCheckout } from '@/components/proposals/ProposalPaymentCheckout';
import {
  acceptPricingRequestWithSignature,
  getPricingRequestByPublicToken,
} from '@/lib/services/pricing-requests';
import { PublicPricingProposal } from '@/lib/types/pricing';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PortalFormField, PortalFormGrid } from '@/components/portal/ui/PortalFormField';

export default function ProposalPublicClient({ token }: { token: string }) {
  const t = useTranslations('proposal');
  const locale = useLocale();
  const [proposal, setProposal] = useState<PublicPricingProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedByName, setAcceptedByName] = useState('');
  const [acceptedByEmail, setAcceptedByEmail] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

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
          proposalVersion: proposal?.proposalVersion,
        })
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  const sendFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!proposal) return;
    setFeedbackSending(true);
    setFeedbackError(null);
    try {
      const response = await fetch(`/api/proposals/${encodeURIComponent(token)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feedbackName,
          message: feedbackMessage,
          proposalVersion: proposal.proposalVersion ?? 0,
        }),
      });
      if (!response.ok) throw new Error(t('error'));
      setFeedbackSent(true);
      await load();
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : t('error'));
    } finally {
      setFeedbackSending(false);
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

  const deposit = proposal.payments.find(
    payment => payment.type === 'deposit' && payment.status !== 'canceled'
  );
  const isAccepted = proposal.status === 'ACCEPTED' || proposal.status === 'PAID';

  return (
    <main data-proposal-document-loaded className="proposal-document min-h-screen bg-surface-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <span className="text-xs text-surface-400">{t('details.version', { number: proposal.proposalVersion || 1 })}</span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a href={`/api/proposals/${encodeURIComponent(token)}/pdf?locale=${locale}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400">
              <Download size={17}/>{t('details.downloadPdf')}
            </a>
            <button type="button" onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400">
              <Printer size={17}/>{t('details.print')}
            </button>
          </div>
        </div>
        {proposal.isPreview && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            {t('preview')}
          </div>
        )}
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 sm:p-8">
          <PublicProposalSummary proposal={proposal} />
        </div>

        <div className="print:hidden">
          {feedbackSent && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{t('details.feedbackSent')}</p>}
          {proposal.status === 'QUOTED' && !feedbackSent && (
            <details className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400">
                <MessageCircle size={18}/>{t('details.feedback')}
              </summary>
              <form onSubmit={sendFeedback} className="mt-5 space-y-4">
                <PortalFormField label={t('details.feedbackName')} required>
                  <Input required minLength={2} maxLength={160} value={feedbackName} onChange={e => setFeedbackName(e.target.value)}/>
                </PortalFormField>
                <PortalFormField label={t('details.feedbackMessage')} required>
                  <textarea required minLength={3} maxLength={2000} rows={4} value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-surface-900 p-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"/>
                </PortalFormField>
                {feedbackError && <p role="alert" className="text-sm text-rose-300">{feedbackError}</p>}
                <Button type="submit" loading={feedbackSending}>{t('details.feedbackSubmit')}</Button>
              </form>
            </details>
          )}
          {isAccepted ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
              <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              <h2 className="mt-3 font-outfit text-xl font-black">{t('accepted.title')}</h2>
              <p className="mt-1 text-sm text-emerald-100/80">{t('accepted.description')}</p>
            </div>
            {deposit && deposit.status !== 'paid' && (
              <ProposalPaymentCheckout payment={deposit} proposalToken={token} onPaid={load} />
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

            <PortalFormGrid className="mt-6 sm:grid-cols-2">
              <PortalFormField label={t('approve.fullName')} required>
                <Input
                  required
                  value={acceptedByName}
                  onChange={event => setAcceptedByName(event.target.value)}
                />
              </PortalFormField>
              <PortalFormField label={t('approve.email')}>
                <Input
                  type="email"
                  value={acceptedByEmail}
                  onChange={event => setAcceptedByEmail(event.target.value)}
                />
              </PortalFormField>
            </PortalFormGrid>

            <PortalFormField label={t('approve.signature')} required className="mt-4">
              <Input
                required
                value={signatureText}
                onChange={event => setSignatureText(event.target.value)}
                className="font-outfit text-lg"
              />
            </PortalFormField>

            <label className="mt-5 flex items-start gap-3 text-sm text-surface-300">
              <input
                className="mt-1 h-4 w-4 rounded border-white/20"
                type="checkbox"
                checked={termsAccepted}
                onChange={event => setTermsAccepted(event.target.checked)}
                required
              />
              <span>{t('approve.checkbox')}</span>
            </label>

            {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

            <Button
              type="submit"
              className="mt-6 min-h-12 w-full font-outfit font-black"
              loading={submitting}
            >
              {t('approve.submit')}
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-surface-300">
            {t('unavailable')}
          </div>
        )}</div>
      </div>
    </main>
  );
}
