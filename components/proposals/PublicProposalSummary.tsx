'use client';

import { calculateSubtotal, calculateTaxAmount, formatCurrency, PublicPricingProposal } from '@/lib/types/pricing';
import { useTranslations } from 'next-intl';

export function PublicProposalSummary({ proposal }: { proposal: PublicPricingProposal }) {
  const t = useTranslations('proposal');
  const subtotal = calculateSubtotal(proposal.lineItems);
  const tax = calculateTaxAmount(subtotal, proposal.taxRate);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-500">
          CartShift Studio
        </p>
        <h1 className="mt-3 font-outfit text-3xl font-black text-white sm:text-4xl">
          {proposal.title}
        </h1>
        {proposal.clientName && (
          <p className="mt-2 text-sm font-semibold text-surface-300">
            {t('preparedFor', { name: proposal.clientName })}
          </p>
        )}
        {proposal.description && (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-surface-300">
            {proposal.description}
          </p>
        )}
      </div>

      <section aria-labelledby="proposal-items">
        <h2 id="proposal-items" className="font-outfit text-lg font-bold text-white">
          {t('scope')}
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          {proposal.lineItems.map(item => (
            <div
              key={item.id}
              className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-bold text-white">{item.title || item.description}</p>
                {item.title && <p className="mt-1 text-sm text-surface-300">{item.description}</p>}
                {item.notes && <p className="mt-1 text-xs text-surface-400">{item.notes}</p>}
                {item.pricingType && (
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary-300">
                    {t(`pricingType.${item.pricingType}`)}
                  </p>
                )}
              </div>
              <div className="text-start sm:text-end">
                <p className="font-bold text-white">
                  {formatCurrency(item.unitPrice * item.quantity, proposal.currency)}
                </p>
                <p className="text-xs text-surface-400">
                  {item.quantity} x {formatCurrency(item.unitPrice, proposal.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ms-auto max-w-sm space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex justify-between gap-6 text-sm text-surface-300">
          <span>{t('subtotal')}</span>
          <span>{formatCurrency(subtotal, proposal.currency)}</span>
        </div>
        {proposal.taxRate > 0 && (
          <div className="flex justify-between gap-6 text-sm text-surface-300">
            <span>{t('vat', { rate: Math.round(proposal.taxRate * 100) })}</span>
            <span>{formatCurrency(tax, proposal.currency)}</span>
          </div>
        )}
        <div className="flex justify-between gap-6 border-t border-white/10 pt-3 text-lg font-black text-white">
          <span>{t('total')}</span>
          <span>{formatCurrency(proposal.totalAmount, proposal.currency)}</span>
        </div>
        {proposal.amountPaid > 0 && (
          <>
            <div className="flex justify-between gap-6 text-sm text-emerald-300">
              <span>{t('amountPaid')}</span>
              <span>{formatCurrency(proposal.amountPaid, proposal.currency)}</span>
            </div>
            <div className="flex justify-between gap-6 text-sm font-bold text-white">
              <span>{t('balanceDue')}</span>
              <span>{formatCurrency(proposal.balanceDue, proposal.currency)}</span>
            </div>
          </>
        )}
      </div>

      {proposal.validUntil && (
        <p className="text-sm text-surface-400">
          {t('validUntil', { date: new Date(proposal.validUntil).toLocaleDateString() })}
        </p>
      )}
      {(proposal.timeframe || proposal.workDeadline) && (
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-surface-300">
          {proposal.timeframe && <p>{t('timeframe', { timeframe: proposal.timeframe })}</p>}
          {proposal.workDeadline && (
            <p>{t('workDeadline', { date: new Date(proposal.workDeadline).toLocaleDateString() })}</p>
          )}
        </div>
      )}

      {proposal.terms && (
        <section aria-labelledby="proposal-terms">
          <h2 id="proposal-terms" className="font-outfit text-lg font-bold text-white">
            {t('terms')}
          </h2>
          <div className="mt-3 whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-surface-300">
            {proposal.terms}
          </div>
        </section>
      )}
    </div>
  );
}
