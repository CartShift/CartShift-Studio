'use client';

import { useState } from 'react';
import { Timestamp } from '@/lib/types/portal';
import { CheckCircle2, Circle, Plus, GripVertical, Trash2, Calendar, Clock } from 'lucide-react';
import { Milestone, MILESTONE_STATUS, Request, MilestoneStatus } from '@/lib/types/portal';
import { updateRequestMilestones, updateMilestoneStatus } from '@/lib/services/portal-requests';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import { cn } from '@/lib/utils';
import { activateOnKeyboard } from '@/lib/utils/portal-interactive';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface RequestMilestonesProps {
  request: Request;
  isAgency: boolean;
}

export function RequestMilestones({ request, isAgency }: RequestMilestonesProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>(request.milestones || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: `ms_${Date.now()}`,
      title: t('portal.milestones.newMilestone'),
      status: MILESTONE_STATUS.PENDING as MilestoneStatus,
      order: milestones.length,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(milestones.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRequestMilestones(request.id, milestones);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving milestones:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (ms: Milestone) => {
    if (isEditing || !isAgency) return;

    // Determine next status
    let nextStatus: MilestoneStatus = MILESTONE_STATUS.PENDING;
    if (ms.status === MILESTONE_STATUS.PENDING) nextStatus = MILESTONE_STATUS.IN_PROGRESS;
    else if (ms.status === MILESTONE_STATUS.IN_PROGRESS) nextStatus = MILESTONE_STATUS.COMPLETED;
    else if (ms.status === MILESTONE_STATUS.COMPLETED) nextStatus = MILESTONE_STATUS.PENDING;

    // Optimistic Update
    const originalStatus = ms.status;
    const updatedMilestones = milestones.map(m =>
      m.id === ms.id ? { ...m, status: nextStatus } : m
    );
    setMilestones(updatedMilestones);

    try {
      await updateMilestoneStatus(request.id, ms.id, nextStatus);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      // Rollback
      setMilestones(milestones.map(m => (m.id === ms.id ? { ...m, status: originalStatus } : m)));
    }
  };

  const progress =
    milestones.length > 0
      ? (milestones.filter(m => m.status === MILESTONE_STATUS.COMPLETED).length /
          milestones.length) *
        100
      : 0;

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
            {t('portal.milestones.title')}
          </h3>
          <p className="portal-label-sm text-[10px] mt-1">
            {t('portal.milestones.subtitle')}
          </p>
        </div>
        {isAgency && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 font-outfit"
            onClick={() => setIsEditing(true)}
          >
            {t('portal.milestones.managePipeline')}
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-surface-400">
              <span>{t('portal.milestones.overallProgress')}</span>
              <span className="text-primary-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-surface-100 dark:bg-surface-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="relative ps-8 space-y-8 before:absolute before:start-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-100 dark:before:bg-surface-800">
            {milestones.length > 0 ? (
              milestones.map(ms => {
                const isActive = ms.id === request.currentMilestoneId;
                const isCompleted = ms.status === MILESTONE_STATUS.COMPLETED;

                return (
                  <div key={ms.id} className="relative">
                    <div
                      onClick={() => handleToggleStatus(ms)}
                      onKeyDown={e => {
                        if (!isAgency || isEditing) return;
                        activateOnKeyboard(e, () => handleToggleStatus(ms));
                      }}
                      tabIndex={isAgency && !isEditing ? 0 : undefined}
                      className={cn(
                        'absolute -start-8 mt-1 w-6.5 h-6.5 rounded-full border-4 border-white dark:border-surface-950 flex items-center justify-center transition-all z-dropdown outline-none',
                        isAgency && !isEditing
                          ? 'portal-focus-ring cursor-pointer hover:scale-110 active:scale-95'
                          : '',
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                      )}
                      role={isAgency && !isEditing ? 'button' : undefined}
                      aria-label={t('portal.accessibility.toggleMilestoneStatus')}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={12} strokeWidth={3} />
                      ) : isActive ? (
                        <Clock size={12} strokeWidth={3} />
                      ) : (
                        <Circle size={8} fill="currentColor" />
                      )}
                    </div>

                    <div
                      className={cn(
                        'flex flex-col gap-1 transition-opacity',
                        !isActive && !isCompleted && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                          {ms.title}
                        </h4>
                        {isActive && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-900/30">
                            {t('portal.milestones.current')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-500 font-medium">
                        {ms.description || t('portal.milestones.deliverablesDescription')}
                      </p>
                      {ms.dueDate && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                          <Calendar size={12} />
                          {t('portal.milestones.target')}{' '}
                          {ms.dueDate.toDate
                            ? format(ms.dueDate.toDate(), 'MMM d, yyyy')
                            : t('portal.milestones.tbd')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-surface-400 italic text-sm">
                {t('portal.milestones.noMilestonesForProject')}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-3">
            {milestones.map(ms => (
              <div
                key={ms.id}
                className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 flex items-center gap-4 group"
              >
                <GripVertical size={18} className="text-surface-300 cursor-move" />
                <div className="flex-1">
                  <PortalFormGrid className="md:grid-cols-2">
                    <Input
                      value={ms.title}
                      onChange={e => handleUpdateMilestone(ms.id, { title: e.target.value })}
                      placeholder={t('portal.milestones.milestoneTitle')}
                    />
                    <Select
                      value={ms.status}
                      onChange={e => handleUpdateMilestone(ms.id, { status: e.target.value as MilestoneStatus })}
                      options={[
                        { value: 'pending', label: t('portal.milestones.status.pending') },
                        { value: 'in_progress', label: t('portal.milestones.status.inProgress') },
                        { value: 'completed', label: t('portal.milestones.status.completed') },
                        { value: 'blocked', label: t('portal.milestones.status.blocked') },
                      ]}
                    />
                  </PortalFormGrid>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(ms.id)}
                  aria-label={t('portal.common.delete')}
                  className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddMilestone}
            className="portal-focus-ring w-full py-4 min-h-[44px] border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl text-surface-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50/20 transition-all font-outfit font-bold flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {t('portal.milestones.addNewPhase')}
          </button>

          <div className="flex gap-3 pt-6 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
              {t('portal.milestones.discard')}
            </Button>
            <Button
              className="flex-1 shadow-lg shadow-primary-500/20"
              onClick={handleSave}
              loading={isSaving}
            >
              {t('portal.milestones.applyPipelineUpdates')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
