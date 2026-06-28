'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalBackdrop, ModalContent } from '@/components/ui/ModalBackdrop';
import { Input } from '@/components/ui/Input';
import { PortalFormField, PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import { useProfitSplitMutations } from '@/lib/hooks/useProfitSplits';
import { calculateProfitSplit } from '@/lib/services/profit-splits';
import { formatCurrency } from '@/lib/types/pricing';
import {
  PROFIT_SPLIT_STATUS,
  ProfitSplit,
  ProfitSplitExpense,
  UpdateProfitSplitData,
} from '@/lib/types/profit-split';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { cn } from '@/lib/utils';
import {
  allocationTone,
  centsFromInput,
  generateLocalId,
  getEditableParticipants,
  roleOrder,
} from '@/lib/utils/profit-split-ui';
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog';

export interface ProfitSplitEditorProps {
  split: ProfitSplit;
  onClose: () => void;
}

export function ProfitSplitEditor({ split, onClose }: ProfitSplitEditorProps) {
  const t = useTranslations('portal');
  const locale = useLocale();
  const { saveDraft, finalize, remove, isMutating } = useProfitSplitMutations();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [directExpenses, setDirectExpenses] = useState<ProfitSplitExpense[]>(split.directExpenses);
  const participants = useMemo(() => getEditableParticipants(split), [split]);

  useEffect(() => {
    setDirectExpenses(split.directExpenses);
  }, [split]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const calculation = useMemo(
    () =>
      calculateProfitSplit({
        grossRevenue: split.grossRevenue,
        directExpenses,
        participants,
      }),
    [directExpenses, participants, split.grossRevenue]
  );

  const requestId = split.requestId ?? split.pricingRequestId;
  const canFinalize =
    split.status === PROFIT_SPLIT_STATUS.DRAFT &&
    calculation.totalAllocatedPercentage === 100 &&
    calculation.netProfit >= 0 &&
    split.projectTitle.trim() &&
    calculation.participants.every(participant => participant.userId && participant.userName);

  const handleSave = async (): Promise<boolean> => {
    const data: UpdateProfitSplitData = { directExpenses };
    try {
      await saveDraft.mutateAsync({ id: split.id, data });
      return true;
    } catch {
      return false;
    }
  };

  const addExpense = () => {
    setDirectExpenses(prev => [
      ...prev,
      { id: generateLocalId('expense'), description: '', amount: 0 },
    ]);
  };

  return (
    <ModalBackdrop isOpen onClick={onClose} variant="surface" zIndex={80}>
      <ModalContent
        maxWidth="full"
        accessibleTitle={t('profitSplits.editorTitle')}
        className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[860px] flex-col overflow-hidden bg-white p-0 dark:bg-surface-950 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-200 p-3.5 dark:border-surface-800 sm:p-4">
          <div>
            <h2
              id="profit-split-editor-title"
              className="text-xl font-black text-surface-900 dark:text-white"
            >
              {t('profitSplits.editorTitle')}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-surface-500 dark:text-surface-400">
              {t('profitSplits.editorSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4">
              <Card className="p-4">
                <PortalFormGrid className="md:grid-cols-3">
                  <PortalFormField label={t('profitSplits.projectTitle')} className="md:col-span-2">
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {split.projectTitle}
                    </p>
                  </PortalFormField>
                  <PortalFormField label={t('profitSplits.client')}>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {split.clientName || split.clientEmail || t('profitSplits.unknownClient')}
                    </p>
                  </PortalFormField>
                  <PortalFormField label={t('profitSplits.grossRevenue')}>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {formatCurrency(split.grossRevenue, split.currency)}
                    </p>
                  </PortalFormField>
                </PortalFormGrid>
              </Card>

              <Card className="p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-surface-900 dark:text-white">
                      {t('profitSplits.expenses')}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {t('profitSplits.expensesHint')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExpense}
                    disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                  >
                    <Plus size={16} />
                    {t('profitSplits.addExpense')}
                  </Button>
                </div>

                <div className="space-y-3">
                  {directExpenses.map(expense => (
                    <div key={expense.id} className="grid gap-3 md:grid-cols-[1fr_160px_44px]">
                      <Input
                        value={expense.description}
                        onChange={event =>
                          setDirectExpenses(prev =>
                            prev.map(item =>
                              item.id === expense.id
                                ? { ...item, description: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder={t('profitSplits.expenseDescription')}
                        disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(expense.amount / 100).toString()}
                        onChange={event =>
                          setDirectExpenses(prev =>
                            prev.map(item =>
                              item.id === expense.id
                                ? { ...item, amount: centsFromInput(event.target.value) }
                                : item
                            )
                          )
                        }
                        disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDirectExpenses(prev => prev.filter(item => item.id !== expense.id))
                        }
                        disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        aria-label={t('profitSplits.removeExpense')}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  {directExpenses.length === 0 && (
                    <p className="rounded-2xl bg-surface-50 p-4 text-sm font-medium text-surface-500 dark:bg-surface-900 dark:text-surface-400">
                      {t('profitSplits.noExpenses')}
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-surface-900 dark:text-white">
                      {t('profitSplits.participants')}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {t('profitSplits.participantsFromRequestHint')}
                    </p>
                  </div>
                  {requestId && split.status === PROFIT_SPLIT_STATUS.DRAFT && (
                    <Link
                      href={getPortalPath(`/requests/${requestId}`, locale)}
                      className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {t('profitSplits.editResponsibilitiesOnRequest')}
                    </Link>
                  )}
                </div>

                <div className="space-y-2">
                  {roleOrder.map(role => {
                    const participant = calculation.participants.find(item => item.role === role);
                    if (!participant) return null;
                    return (
                      <div
                        key={role}
                        className="grid gap-2 rounded-xl border border-surface-200 p-2.5 text-[13px] dark:border-surface-800 md:grid-cols-[132px_1fr_112px]"
                      >
                        <span className="font-bold text-surface-500">
                          {t(`profitSplits.roles.${role}`)}
                        </span>
                        <span className="font-bold text-surface-900 dark:text-white">
                          {participant.userName || t('profitSplits.unassigned')}
                        </span>
                        <span className="font-black text-surface-900 dark:text-white">
                          {participant.percentage}% ·{' '}
                          {formatCurrency(participant.amount, split.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <aside className="space-y-3">
              <Card
                className="p-4"
                accent={
                  allocationTone({ ...split, ...calculation }) === 'success' ? 'success' : 'warning'
                }
              >
                <h3 className="text-base font-black text-surface-900 dark:text-white">
                  {t('profitSplits.liveCalculation')}
                </h3>
                <div className="mt-3 space-y-2.5 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-surface-500">{t('profitSplits.grossRevenue')}</span>
                    <span className="font-black text-surface-900 dark:text-white">
                      {formatCurrency(split.grossRevenue, split.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-surface-500">{t('profitSplits.totalExpenses')}</span>
                    <span className="font-black text-rose-600">
                      {formatCurrency(calculation.totalExpenses, split.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-surface-200 pt-2.5 dark:border-surface-800">
                    <span className="text-surface-500">{t('profitSplits.netProfit')}</span>
                    <span
                      className={cn(
                        'font-black',
                        calculation.netProfit < 0
                          ? 'text-rose-600'
                          : 'text-emerald-700 dark:text-emerald-300'
                      )}
                    >
                      {formatCurrency(calculation.netProfit, split.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-surface-500">{t('profitSplits.totalAllocated')}</span>
                    <span className="font-black text-surface-900 dark:text-white">
                      {calculation.totalAllocatedPercentage}% ·{' '}
                      {formatCurrency(calculation.totalAllocatedAmount, split.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-surface-500">{t('profitSplits.unallocated')}</span>
                    <span className="font-black text-surface-900 dark:text-white">
                      {calculation.unallocatedPercentage}% ·{' '}
                      {formatCurrency(calculation.unallocatedAmount, split.currency)}
                    </span>
                  </div>
                </div>

                {calculation.netProfit < 0 && (
                  <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-[13px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {t('profitSplits.negativeProfitWarning')}
                  </div>
                )}
                {calculation.totalAllocatedPercentage !== 100 && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-2.5 text-[13px] font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    {t('profitSplits.allocationWarning')}
                  </div>
                )}
              </Card>
            </aside>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-200 p-3.5 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="text-[13px] font-medium text-surface-500">
            {split.status === PROFIT_SPLIT_STATUS.FINALIZED
              ? t('profitSplits.finalizedLocked')
              : t('profitSplits.draftHint')}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {split.status === PROFIT_SPLIT_STATUS.DRAFT && (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  const ok = await confirm({
                    title: t('common.deleteConfirmTitle'),
                    description: t('common.deleteConfirm'),
                    confirmText: t('common.delete'),
                    cancelText: t('common.cancel'),
                    variant: 'danger',
                  });
                  if (!ok) return;
                  try {
                    await remove.mutateAsync(split.id);
                    onClose();
                  } catch {
                    // Mutation feedback is handled by Sonner in the hook.
                  }
                }}
                disabled={isMutating}
              >
                <Trash2 size={16} />
                {t('common.delete')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            {split.status === PROFIT_SPLIT_STATUS.DRAFT && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSave}
                loading={saveDraft.isPending}
                disabled={isMutating}
              >
                <Save size={16} />
                {t('profitSplits.saveDraft')}
              </Button>
            )}
            {split.status === PROFIT_SPLIT_STATUS.DRAFT && (
              <Button
                type="button"
                variant="success"
                onClick={async () => {
                  if (!(await handleSave())) return;
                  try {
                    await finalize.mutateAsync(split.id);
                    onClose();
                  } catch {
                    // Mutation feedback is handled by Sonner in the hook.
                  }
                }}
                loading={finalize.isPending}
                disabled={!canFinalize || isMutating}
              >
                <CheckCircle2 size={16} />
                {t('profitSplits.finalize')}
              </Button>
            )}
          </div>
        </div>
      </ModalContent>
      {ConfirmDialog}
    </ModalBackdrop>
  );
}
