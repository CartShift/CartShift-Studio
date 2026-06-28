'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { ConsultationType, CONSULTATION_TYPE, CONSULTATION_TYPE_CONFIG } from '@/lib/types/portal';
import { AnimatePresence, motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PortalFormField, PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import {
  CheckCircle2,
  Calendar,
  ExternalLink,
  LinkIcon,
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  getCalendarConnection,
  getFreeBusyIntervals,
  tryCreateCalendarEventForConsultation,
  initiateGoogleOAuth,
} from '@/lib/services/portal-google-calendar';

// Helper function to open calendar event popup
function openCalendarEventPopup(url: string): void {
  window.open(url, '_blank', 'width=600,height=600');
}
import { createConsultation, CreateConsultationData } from '@/lib/services/portal-consultations';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog';

// Type icons mapping
const typeIcons: Record<
  ConsultationType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  [CONSULTATION_TYPE.ONBOARDING]: Calendar,
  [CONSULTATION_TYPE.STRATEGY]: FileText,
  [CONSULTATION_TYPE.PROJECT_REVIEW]: CheckCircle2,
  [CONSULTATION_TYPE.SUPPORT]: FileText,
};

// ... (removing unused imports X, createPortal)

interface ScheduleConsultationFormProps {
  orgId: string;
  orgName: string;
  clientEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleConsultationForm({
  orgId,
  orgName,
  clientEmail,
  onClose,
  onSuccess,
}: ScheduleConsultationFormProps) {
  // ... (hook logic remains the same)
  const t = useTranslations('portal');
  const { userData } = usePortalAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ConsultationType>(CONSULTATION_TYPE.ONBOARDING);
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [autoCreated, setAutoCreated] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  // Smart Calendar Features
  const [isConnected, setIsConnected] = useState(false);
  const [checkingAvailability, setAvailability] = useState(false);
  const [busySlots, setBusySlots] = useState<{ start: Date; end: Date }[]>([]);

  useEffect(() => {
    getCalendarConnection().then(conn => setIsConnected(conn.connected));
  }, []);

  useEffect(() => {
    if (isConnected && scheduledDate) {
      setAvailability(true);
      const dateObj = new Date(scheduledDate);

      // Expand the window to cover timezone differences
      const timeMin = new Date(dateObj);
      timeMin.setDate(timeMin.getDate() - 1);

      const timeMax = new Date(dateObj);
      timeMax.setDate(timeMax.getDate() + 2);

      getFreeBusyIntervals(timeMin, timeMax)
        .then(slots => {
          setBusySlots(slots);
        })
        .finally(() => {
          setAvailability(false);
        });
    }
  }, [isConnected, scheduledDate]);

  const hasConflict = useMemo(() => {
    if (!scheduledDate || !scheduledTime) return false;
    const start = new Date(`${scheduledDate}T${scheduledTime}`);
    const end = new Date(start.getTime() + duration * 60000);

    return busySlots.some(slot => start < slot.end && end > slot.start);
  }, [scheduledDate, scheduledTime, duration, busySlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !title || !scheduledDate || !scheduledTime) return;

    if (hasConflict) {
      const ok = await confirm({
        title: t('common.confirm'),
        description: t('consultations.form.calendarConflict'),
        confirmText: t('common.submit'),
        cancelText: t('common.cancel'),
        variant: 'warning',
      });
      if (!ok) return;
    }

    setLoading(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

      const calendarResult = await tryCreateCalendarEventForConsultation({
        title,
        description,
        scheduledAt,
        durationMinutes: duration,
        attendeeEmails: clientEmail ? [clientEmail] : undefined,
        clientName: orgName,
        orgId,
        type,
      });

      const consultationData: CreateConsultationData = {
        orgId,
        type,
        title,
        description,
        scheduledAt,
        duration,
        externalCalendarLink: calendarResult.success ? calendarResult.meetLink : undefined,
        externalEventId: calendarResult.success ? calendarResult.eventId : undefined,
      };

      await createConsultation(
        userData.id,
        userData.name || t('common.agencyFallback'),
        consultationData
      );

      setAutoCreated(calendarResult.success);
      setMeetLink(calendarResult.meetLink || null);
      setCalendarUrl(calendarResult.fallbackLink || null);
      setSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create consultation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCalendar = () => {
    if (calendarUrl) {
      openCalendarEventPopup(calendarUrl);
    }
  };

  // Don't render if document.body is not available
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return (
    <ModalBackdrop isOpen={true} onClick={onClose}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader
          title={t('consultations.schedule')}
          description={orgName}
          onClose={onClose}
        />

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ModalBody className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                  Consultation Scheduled!
                </h3>
                {autoCreated ? (
                  <>
                    <p className="text-surface-500 mb-2">
                      ✨ Calendar event created automatically!
                    </p>
                    {meetLink && (
                      <p className="text-sm text-primary-600 dark:text-primary-400 mb-6">
                        Meet link: {meetLink}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-surface-500 mb-6">
                    Add this meeting to your Google Calendar to get a Meet link automatically.
                  </p>
                )}
              </ModalBody>

              <ModalFooter align="center">
                {!autoCreated && calendarUrl && (
                  <Button variant="primary" onClick={handleAddToCalendar} className="gap-2">
                    <Calendar size={18} />
                    Add to Google Calendar
                    <ExternalLink size={14} className="opacity-60" />
                  </Button>
                )}
                <Button variant={autoCreated ? 'primary' : 'outline'} onClick={onClose}>
                  Done
                </Button>
              </ModalFooter>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-5">
                  {/* Connection Status Banner */}
                  {!isConnected ? (
                    <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
                      <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <LinkIcon size={16} />
                        <span>Link Google Calendar for auto-sync</span>
                      </div>
                      <button
                        type="button"
                        onClick={initiateGoogleOAuth}
                        className="text-xs font-bold text-primary-600 hover:underline"
                      >
                        Connect Now
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg w-fit">
                      <CheckCircle2 size={12} />
                      <span>Calendar synced & checking availability</span>
                    </div>
                  )}

                  {/* Consultation Type */}
                  <div>
                    <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                      {t('consultations.form.type')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(CONSULTATION_TYPE).map(typeOption => {
                        const config = CONSULTATION_TYPE_CONFIG[typeOption];
                        const Icon = typeIcons[typeOption];
                        return (
                          <button
                            key={typeOption}
                            type="button"
                            onClick={() => setType(typeOption)}
                            className={cn(
                              'p-3 rounded-xl border-2 transition-all flex items-center gap-2',
                              type === typeOption
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                            )}
                          >
                            <Icon className={cn('w-4 h-4', config.color)} />
                            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                              {t(`consultations.types.${typeOption}`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <PortalFormField label={t('consultations.form.title')}>
                    <Input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={t('consultations.form.titlePlaceholder')}
                      required
                    />
                  </PortalFormField>

                  {/* Date & Time */}
                  <div className="space-y-4">
                    <PortalFormGrid>
                      <PortalFormField label={t('consultations.form.date')}>
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={e => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </PortalFormField>
                      <PortalFormField
                        label={t('consultations.form.time')}
                        error={hasConflict ? 'Conflict detected with your calendar' : undefined}
                      >
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={e => setScheduledTime(e.target.value)}
                          error={hasConflict ? 'Conflict detected with your calendar' : undefined}
                          required
                        />
                      </PortalFormField>
                    </PortalFormGrid>

                    {/* Availability Status */}
                    {scheduledDate && isConnected && (
                      <div className="text-xs min-h-[20px]">
                        {checkingAvailability ? (
                          <span className="flex items-center gap-1 text-surface-500">
                            <Loader2 size={12} className="animate-spin" />
                            availability...
                          </span>
                        ) : hasConflict ? (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"
                          >
                            <AlertTriangle size={14} />
                            <span>Conflict detected with your calendar</span>
                          </motion.div>
                        ) : scheduledTime ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Available
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <PortalFormField label={t('consultations.form.duration')}>
                    <Select
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      options={[
                        { value: 15, label: '15 minutes' },
                        { value: 30, label: '30 minutes' },
                        { value: 45, label: '45 minutes' },
                        { value: 60, label: '1 hour' },
                        { value: 90, label: '1.5 hours' },
                        { value: 120, label: '2 hours' },
                      ]}
                    />
                  </PortalFormField>

                  {/* Description */}
                  <PortalFormField label={t('consultations.form.notes')}>
                    <Textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={t('consultations.form.notesPlaceholder')}
                      rows={3}
                      className="resize-none"
                    />
                  </PortalFormField>

                  <p className="text-xs text-center text-surface-500 pt-2">
                    {!isConnected
                      ? "📅 After scheduling, you'll be prompted to add this to Google Calendar with a Meet link"
                      : '✨ Event will be automatically added to your Google Calendar with Meet link'}
                  </p>
                </ModalBody>

                <ModalFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 gap-2"
                    disabled={loading || !title || !scheduledDate || !scheduledTime}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        ...
                      </>
                    ) : (
                      <>
                        <Calendar size={18} />
                        Schedule
                      </>
                    )}
                  </Button>
                </ModalFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
      {ConfirmDialog}
    </ModalBackdrop>
  );
}
