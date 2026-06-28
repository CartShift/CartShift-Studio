'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalBackdrop, ModalContent } from '@/components/ui/ModalBackdrop';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { PortalFormField, PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import { useProfitSplitMutations } from '@/lib/hooks/useProfitSplits';
import { calculateProfitSplit } from '@/lib/services/profit-splits';
import { formatCurrency } from '@/lib/types/pricing';
import {
  PROFIT_SPLIT_ROLE,
  PROFIT_SPLIT_STATUS,
  ProfitSplit,
  ProfitSplitExpense,
  ProfitSplitParticipant,
  ProfitSplitRole,
  UpdateProfitSplitData,
} from '@/lib/types/profit-split';
import { PricingRequest } from '@/lib/types/pricing';
import { PortalUser } from '@/lib/types/portal';
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
  split: ProfitSplit | null;
  paidRequests: PricingRequest[];
  existingSplits: ProfitSplit[];
  agencyTeam: PortalUser[];
  onClose: () => void;
  onCreated: (split: ProfitSplit) => void;
}

export function ProfitSplitEditor({
  split,
  paidRequests,
  existingSplits,
  agencyTeam,
  onClose,
  onCreated,
}: ProfitSplitEditorProps) {
  const t = useTranslations('portal');
  const { createFromPricingRequest, saveDraft, finalize, remove, isMutating } =
    useProfitSplitMutations();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [selectedPricingRequestId, setSelectedPricingRequestId] = useState('');
  const [projectTitle, setProjectTitle] = useState(split?.projectTitle ?? '');
  const [clientName, setClientName] = useState(split?.clientName ?? '');
  const [grossRevenue, setGrossRevenue] = useState(split?.grossRevenue ?? 0);
  const [directExpenses, setDirectExpenses] = useState<ProfitSplitExpense[]>(
    split?.directExpenses ?? []
  );
  const [participants, setParticipants] = useState<Omit<ProfitSplitParticipant, 'amount'>[]>(
    split ? getEditableParticipants(split) : []
  );

  useEffect(() => {
    if (!split) return;
    setProjectTitle(split.projectTitle);
    setClientName(split.clientName ?? '');
    setGrossRevenue(split.grossRevenue);
    setDirectExpenses(split.directExpenses);
    setParticipants(getEditableParticipants(split));
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
      split
        ? calculateProfitSplit({
            grossRevenue,
            directExpenses,
            participants,
          })
        : null,
    [directExpenses, grossRevenue, participants, split]
  );

  const selectedPricingRequest = paidRequests.find(
    request => request.id === selectedPricingRequestId
  );
  const availablePaidRequests = paidRequests.filter(
    request =>
      !existingSplits.some(existing => existing.pricingRequestId === request.id) ||
      request.id === split?.pricingRequestId
  );

  const canFinalize =
    !!split &&
    split.status === PROFIT_SPLIT_STATUS.DRAFT &&
    !!calculation &&
    calculation.totalAllocatedPercentage === 100 &&
    calculation.netProfit >= 0 &&
    !!projectTitle.trim() &&
    calculation.participants.every(participant => participant.userId && participant.userName);

  const handleCreate = async () => {
    if (!selectedPricingRequestId) return;
    try {
      const created = await createFromPricingRequest.mutateAsync(selectedPricingRequestId);
      onCreated(created);
    } catch {
      // Mutation feedback is handled by Sonner in the hook.
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!split || !calculation) return false;
    const data: UpdateProfitSplitData = {
      projectTitle,
      clientName,
      grossRevenue,
      directExpenses,
      participants,
    };
    try {
      await saveDraft.mutateAsync({ id: split.id, data });
      return true;
    } catch {
      // Mutation feedback is handled by Sonner in the hook.
      return false;
    }
  };

  const addExpense = () => {
    setDirectExpenses(prev => [
      ...prev,
      { id: generateLocalId('expense'), description: '', amount: 0 },
    ]);
  };

  const addParticipant = () => {
    setParticipants(prev => [
      ...prev,
      {
        id: generateLocalId('participant'),
        userId: '',
        userName: '',
        role: PROFIT_SPLIT_ROLE.DELIVERY,
        percentage: 0,
      },
    ]);
  };

  return (
    <ModalBackdrop isOpen onClick={onClose} variant="surface" zIndex={80}>
      <ModalContent
        maxWidth="full"
        accessibleTitle={split ? t('profitSplits.editorTitle') : t('profitSplits.createTitle')}
        className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[860px] flex-col overflow-hidden bg-white p-0 dark:bg-surface-950 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)]"
      >
          <div className="flex items-start justify-between gap-3 border-b border-surface-200 p-3.5 dark:border-surface-800 sm:p-4">
            <div>
              <h2
                id="profit-split-editor-title"
                className="text-xl font-black text-surface-900 dark:text-white"
              >
                {split ? t('profitSplits.editorTitle') : t('profitSplits.createTitle')}
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
            {!split ? (
              <div className="mx-auto max-w-xl space-y-4">
                <Card className="p-4">
                  <Select
                    label={t('profitSplits.selectPaidRequest')}
                    value={selectedPricingRequestId}
                    onChange={event => setSelectedPricingRequestId(event.target.value)}
                  >
                    <option value="">{t('profitSplits.selectPaidRequestPlaceholder')}</option>
                    {availablePaidRequests.map(request => (
                      <option key={request.id} value={request.id}>
                        {request.title} · {formatCurrency(request.totalAmount, request.currency)}
                      </option>
                    ))}
                  </Select>

                  {selectedPricingRequest && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-[13px] text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                      <p className="font-bold">{selectedPricingRequest.title}</p>
                      <p className="mt-1">
                        {selectedPricingRequest.clientName ||
                          selectedPricingRequest.clientEmail ||
                          'Client'}{' '}
                        ·{' '}
                        {formatCurrency(
                          selectedPricingRequest.totalAmount,
                          selectedPricingRequest.currency
                        )}
                      </p>
                    </div>
                  )}

                  {availablePaidRequests.length === 0 && (
                    <p className="mt-4 text-sm font-medium text-surface-500">
                      {t('profitSplits.noPaidRequests')}
                    </p>
                  )}
                </Card>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-4">
                  <Card className="p-4">
                    <PortalFormGrid className="md:grid-cols-3">
                      <PortalFormField
                        label={t('profitSplits.projectTitle')}
                        className="md:col-span-2"
                      >
                        <Input
                          value={projectTitle}
                          onChange={event => setProjectTitle(event.target.value)}
                          disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        />
                      </PortalFormField>
                      <PortalFormField label={t('profitSplits.client')}>
                        <Input
                          value={clientName}
                          onChange={event => setClientName(event.target.value)}
                          disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        />
                      </PortalFormField>
                      <PortalFormField label={t('profitSplits.grossRevenue')}>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(grossRevenue / 100).toString()}
                          onChange={event => setGrossRevenue(centsFromInput(event.target.value))}
                          disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        />
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
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-surface-900 dark:text-white">
                          {t('profitSplits.participants')}
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {t('profitSplits.participantsHint')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addParticipant}
                        disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                      >
                        <Plus size={16} />
                        {t('profitSplits.addParticipant')}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {participants.map(participant => {
                        const calculatedParticipant = calculation?.participants.find(
                          item => item.id === participant.id
                        );

                        return (
                          <div
                            key={participant.id}
                            className="grid gap-2.5 rounded-xl border border-surface-200 p-2.5 dark:border-surface-800 xl:grid-cols-[132px_1fr_112px_132px_1fr_40px]"
                          >
                            <Select
                              value={participant.role}
                              onChange={event =>
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? { ...item, role: event.target.value as ProfitSplitRole }
                                      : item
                                  )
                                )
                              }
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                              options={roleOrder.map(role => ({
                                value: role,
                                label: t(`profitSplits.roles.${role}`),
                              }))}
                            />
                            <Select
                              value={participant.userId}
                              onChange={event => {
                                const user = agencyTeam.find(
                                  member => member.id === event.target.value
                                );
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? {
                                          ...item,
                                          userId: user?.id ?? '',
                                          userName: user?.name || user?.email || '',
                                        }
                                      : item
                                  )
                                );
                              }}
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            >
                              <option value="">{t('profitSplits.unassigned')}</option>
                              {agencyTeam.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name || member.email}
                                </option>
                              ))}
                            </Select>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={participant.percentage.toString()}
                              onChange={event =>
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? { ...item, percentage: Number(event.target.value) || 0 }
                                      : item
                                  )
                                )
                              }
                              aria-label={t('profitSplits.percentage')}
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            />
                            <div className="flex h-10 items-center rounded-lg bg-surface-50 px-3 text-[13px] font-black text-surface-900 dark:bg-surface-900 dark:text-white">
                              {calculatedParticipant
                                ? formatCurrency(calculatedParticipant.amount, split.currency)
                                : formatCurrency(0, split.currency)}
                            </div>
                            <Input
                              value={participant.notes ?? ''}
                              onChange={event =>
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? { ...item, notes: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder={t('profitSplits.notes')}
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setParticipants(prev =>
                                  prev.filter(item => item.id !== participant.id)
                                )
                              }
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                              aria-label={t('profitSplits.removeParticipant')}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {calculation && (
                  <aside className="space-y-3">
                    <Card
                      className="p-4"
                      accent={
                        allocationTone({ ...split, ...calculation }) === 'success'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      <h3 className="text-base font-black text-surface-900 dark:text-white">
                        {t('profitSplits.liveCalculation')}
                      </h3>
                      <div className="mt-3 space-y-2.5 text-[13px]">
                        <div className="flex justify-between gap-3">
                          <span className="text-surface-500">{t('profitSplits.grossRevenue')}</span>
                          <span className="font-black text-surface-900 dark:text-white">
                            {formatCurrency(grossRevenue, split.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-surface-500">
                            {t('profitSplits.totalExpenses')}
                          </span>
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
                          <span className="text-surface-500">
                            {t('profitSplits.totalAllocated')}
                          </span>
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
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-surface-200 p-3.5 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="text-[13px] font-medium text-surface-500">
              {split?.status === PROFIT_SPLIT_STATUS.FINALIZED
                ? t('profitSplits.finalizedLocked')
                : t('profitSplits.draftHint')}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {split && split.status === PROFIT_SPLIT_STATUS.DRAFT && (
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
              {!split ? (
                <Button
                  type="button"
                  onClick={handleCreate}
                  loading={createFromPricingRequest.isPending}
                  disabled={!selectedPricingRequestId || isMutating}
                >
                  <Plus size={16} />
                  {t('profitSplits.create')}
                </Button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
      </ModalContent>
      {ConfirmDialog}
    </ModalBackdrop>
  );
}
