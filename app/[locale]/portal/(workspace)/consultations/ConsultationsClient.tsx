'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UserPlus,
  Target,
  ClipboardCheck,
  Headphones,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Consultation,
  CONSULTATION_TYPE_CONFIG,
  CONSULTATION_STATUS_CONFIG,
  ConsultationType,
  CONSULTATION_STATUS,
} from '@/lib/types/portal';
import { deleteCalendarEvent } from '@/lib/services/portal-google-calendar';
import { getScheduleUrl } from '@/lib/schedule';
import { trackBookCallClick } from '@/lib/analytics';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useConsultations } from '@/lib/hooks/useConsultations';
import { useConsultationMutations } from '@/lib/hooks/useConsultationMutations';

const typeIcons: Record<ConsultationType, React.ElementType> = {
  onboarding: UserPlus,
  strategy: Target,
  project_review: ClipboardCheck,
  support: Headphones,
};

export default function ConsultationsClient() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const { userData } = usePortalAuth();
  const { consultations: consultationsData, loading: consultations } = useConsultations();

  const { cancelMutation, isCanceling } = useConsultationMutations();
  const dateLocale = getDateLocale(locale);

  const now = new Date();
  const upcomingConsultations = consultationsData.filter(
    c =>
      c.status === CONSULTATION_STATUS.SCHEDULED &&
      (c.scheduledAt?.toDate ? c.scheduledAt.toDate() > now : true)
  );
  const pastConsultations = consultationsData.filter(
    c =>
      c.status !== CONSULTATION_STATUS.SCHEDULED ||
      (c.scheduledAt?.toDate ? c.scheduledAt.toDate() <= now : false)
  );

  const loading = consultations;

  const handleScheduleClick = () => {
    trackBookCallClick('portal_consultations');
    window.open(getScheduleUrl(), '_blank');
  };

  const handleCancel = async (consultation: Consultation) => {
    if (!confirm(t('consultations.form.cancelConfirm'))) {
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        consultationId: consultation.id,
        orgId: consultation.orgId,
        userId: userData?.id || 'unknown',
        userName: userData?.name || t('consultations.userFallback'),
      });

      if (consultation.externalEventId) {
        // Attempt to delete from Google Calendar
        deleteCalendarEvent(consultation.externalEventId).catch(console.error);
      }
    } catch (error) {
      // Error handled by mutation toast
      console.error('Failed to cancel consultation:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white font-outfit tracking-tight">
            {t('consultations.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t('consultations.clientSubtitle')}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={handleScheduleClick}>
          <Calendar size={18} />
          {t('consultations.scheduleCall')}
          <ExternalLink size={14} className="opacity-60" />
        </Button>
      </div>

      {/* Upcoming Consultations */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          {t('consultations.upcoming')}
          {upcomingConsultations.length > 0 && (
            <span className="ms-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold rounded-lg">
              {upcomingConsultations.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : upcomingConsultations.length === 0 ? (
          <div className="text-center py-12 bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-800">
            <div className="w-14 h-14 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-surface-400" />
            </div>
            <h3 className="text-base font-bold text-surface-700 dark:text-surface-300 mb-2">
              {t('consultations.noUpcoming')}
            </h3>
            <p className="text-surface-500 text-sm mb-4">{t('consultations.noUpcomingDesc')}</p>
            <Button variant="outline" onClick={handleScheduleClick} className="gap-2">
              <Calendar size={16} />
              {t('consultations.scheduleNow')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingConsultations.map((consultation, index) => {
              const TypeIcon = typeIcons[consultation.type];
              const typeConfig = CONSULTATION_TYPE_CONFIG[consultation.type];
              const scheduledDate = consultation.scheduledAt?.toDate
                ? consultation.scheduledAt.toDate()
                : new Date();

              return (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 bg-white dark:bg-surface-900 rounded-2xl border-2 border-primary-200 dark:border-primary-800 shadow-lg shadow-primary-500/5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        typeConfig.bgColor
                      )}
                    >
                      <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                        {consultation.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-surface-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={14} className="text-primary-500" />
                          {format(scheduledDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={14} className="text-primary-500" />
                          {format(scheduledDate, 'HH:mm', { locale: dateLocale })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {consultation.duration} {t('consultations.minutes')}
                        </span>
                      </div>
                      {consultation.description && (
                        <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
                          {consultation.description}
                        </p>
                      )}
                      {consultation.agendaItems && consultation.agendaItems.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-surface-500 mb-2">
                            {t('consultations.agenda')}
                          </p>
                          <ul className="space-y-1">
                            {consultation.agendaItems.map((item, i) => (
                              <li
                                key={i}
                                className="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0 shrink-0">
                      {consultation.externalCalendarLink && (
                        <a
                          href={consultation.externalCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors justify-center touch-manipulation active:scale-95"
                        >
                          <Video size={16} />
                          {t('consultations.join')}
                        </a>
                      )}
                      <button
                        disabled={
                          isCanceling &&
                          cancelMutation.variables?.consultationId === consultation.id
                        }
                        onClick={() => handleCancel(consultation)}
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-2.5 min-h-[44px] rounded-xl transition-colors flex items-center gap-2 font-bold disabled:opacity-50 touch-manipulation active:scale-95"
                      >
                        {isCanceling &&
                        cancelMutation.variables?.consultationId === consultation.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        {isCanceling && cancelMutation.variables?.consultationId === consultation.id
                          ? t('common.loading')
                          : t('consultations.cancel')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Consultations */}
      {pastConsultations.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-surface-500" />
            {t('consultations.past')}
          </h2>

          <div className="space-y-3">
            {pastConsultations.map((consultation, index) => {
              const TypeIcon = typeIcons[consultation.type];
              const typeConfig = CONSULTATION_TYPE_CONFIG[consultation.type];
              const statusConfig = CONSULTATION_STATUS_CONFIG[consultation.status];
              const scheduledDate = consultation.scheduledAt?.toDate
                ? consultation.scheduledAt.toDate()
                : new Date();

              return (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 opacity-60',
                        typeConfig.bgColor
                      )}
                    >
                      <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-surface-700 dark:text-surface-300 truncate">
                        {consultation.title}
                      </h3>
                      <p className="text-xs text-surface-500">
                        {format(scheduledDate, 'MMM d, yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}
                    >
                      {t(`consultations.status.${consultation.status}`)}
                    </span>
                  </div>
                  {consultation.meetingNotes && (
                    <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                      <p className="text-xs font-bold text-surface-500 mb-1 flex items-center gap-1">
                        <MessageSquare size={12} />
                        {t('consultations.notes')}
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        {consultation.meetingNotes}
                      </p>
                    </div>
                  )}
                  {consultation.actionItems && consultation.actionItems.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-surface-500 mb-2">
                        {t('consultations.actionItems')}
                      </p>
                      <ul className="space-y-1">
                        {consultation.actionItems.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-2"
                          >
                            <CheckCircle2 size={14} className="text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
