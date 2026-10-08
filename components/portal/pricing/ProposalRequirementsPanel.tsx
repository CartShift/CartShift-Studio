'use client';

import { useTranslations } from 'next-intl';
import { ClipboardCheck, CircleCheck, CircleDashed, Wallet, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Request } from '@/lib/types/portal';
import { useProposalRequirements } from '@/lib/hooks/useProposalRequirements';

const editableStatuses = new Set(['ACCEPTED', 'PAID', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED']);

type RequirementsRequest = Pick<Request, 'id' | 'status' | 'proposalContent' | 'proposalRequirementStatuses' | 'paymentRequired' | 'depositAmount' | 'amountPaid'>;

export function ProposalRequirementsPanel({ request, isAgency }: { request: RequirementsRequest; isAgency: boolean }) {
  const t = useTranslations('portal.proposalRequirements');
  const mutation = useProposalRequirements(request.id);
  const requirements = request.proposalContent?.requirements ?? [];
  if (requirements.length === 0) return null;

  const statuses = request.proposalRequirementStatuses ?? {};
  const isAccepted = editableStatuses.has(request.status);
  const depositReady = !request.paymentRequired || (request.amountPaid ?? 0) >= (request.depositAmount ?? 0);
  const materialsReady = requirements.filter(req => req.required).every(req => statuses[req.id] === 'approved');
  const ready = isAccepted && depositReady && materialsReady;

  return (
    <section aria-labelledby="proposal-requirements-title"
      className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-950 sm:p-6">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-1 shrink-0 text-primary-600" size={22}/>
        <div className="min-w-0">
          <h3 id="proposal-requirements-title" className="text-lg font-bold text-surface-900 dark:text-white">{t('title')}</h3>
          <p className="mt-1 text-sm text-surface-500">{t('subtitle')}</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {requirements.map(item => {
          const status = statuses[item.id] ?? 'pending';
          return (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-medium text-surface-900 dark:text-white">
                  {item.title}
                  {item.required && <span className="ms-2 text-xs text-surface-500">({t('required')})</span>}
                </div>
                {item.details && <p className="mt-1 text-sm text-surface-500">{item.details}</p>}
              </div>
              {isAgency && isAccepted ? (
                <select aria-label={`${item.title} - ${t('title')}`} value={status}
                  disabled={mutation.isPending}
                  onChange={e => mutation.mutate({
                    requirementId: item.id,
                    status: e.target.value as 'pending' | 'received' | 'approved',
                  }, { onError: () => toast.error(t('updateFailed')) })}
                  className="min-h-10 shrink-0 rounded-lg border border-surface-200 bg-white px-3 text-sm font-semibold text-surface-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-white">
                  <option value="pending">{t('pending')}</option>
                  <option value="received">{t('received')}</option>
                  <option value="approved">{t('approved')}</option>
                </select>
              ) : (
                <span className="text-sm font-medium text-surface-500">{t(status)}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex items-start gap-2">
          {isAccepted ? <CircleCheck className="shrink-0 text-emerald-600" size={18}/> : <CircleDashed className="shrink-0" size={18}/>}
          <span>{isAccepted ? t('approvedOffer') : t('awaitingOffer')}</span>
        </div>
        <div className="flex items-start gap-2">
          <Wallet className={depositReady ? 'shrink-0 text-emerald-600' : 'shrink-0 text-amber-600'} size={18}/>
          <span>{!request.paymentRequired ? t('paymentNotRequired') : depositReady ? t('paymentComplete') : t('paymentPending')}</span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className={materialsReady ? 'shrink-0 text-emerald-600' : 'shrink-0 text-amber-600'} size={18}/>
          <span>{ready ? t('ready') : t('waiting')}</span>
        </div>
      </div>
    </section>
  );
}
