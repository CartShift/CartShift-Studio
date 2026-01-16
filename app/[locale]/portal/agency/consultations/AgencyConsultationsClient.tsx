'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  UserPlus,
  Target,
  ClipboardCheck,
  Headphones,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Consultation,
  CONSULTATION_TYPE_CONFIG,
  CONSULTATION_STATUS_CONFIG,
  ConsultationType,
  ConsultationStatus,
  CONSULTATION_STATUS,
  Organization,
} from '@/lib/types/portal';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useConsultations } from '@/lib/hooks/useConsultations';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { useConsultationMutations } from '@/lib/hooks/useConsultationMutations';
import ScheduleConsultationForm from '@/components/portal/ScheduleConsultationForm';

const typeIcons: Record<ConsultationType, React.ElementType> = {
  onboarding: UserPlus,
  strategy: Target,
  project_review: ClipboardCheck,
  support: Headphones,
};

export default function AgencyConsultationsClient() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const { userData } = usePortalAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'all'>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const { organizations, loading: clients } = useAgencyClients();
  const { consultations: consultationsData, loading: consultations } = useConsultations({
    status: statusFilter,
  });
  const { cancelMutation, completeMutation, isCanceling, isCompleting } =
    useConsultationMutations();

  const loading = consultations || clients;
  const dateLocale = getDateLocale(locale);

  const orgNames = organizations.reduce(
    (acc, org) => {
      acc[org.id] = org.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const filteredConsultations = consultationsData.filter(c => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(query) ||
        (orgNames[c.orgId] || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleComplete = async (consultation: Consultation) => {
    if (!userData) return;
    try {
      await completeMutation.mutateAsync({
        consultationId: consultation.id,
        orgId: consultation.orgId,
        userId: userData.id,
        userName: userData.name || t('common.agencyFallback'),
      });
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  const handleCancel = async (consultation: Consultation) => {
    if (!userData) return;
    if (!confirm(t('consultations.form.cancelConfirm'))) return;

    try {
      await cancelMutation.mutateAsync({
        consultationId: consultation.id,
        orgId: consultation.orgId,
        userId: userData.id,
        userName: userData.name || t('common.agencyFallback'),
      });
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  const now = new Date();
  const upcomingCount = consultationsData.filter(
    c =>
      c.status === CONSULTATION_STATUS.SCHEDULED &&
      (c.scheduledAt?.toDate ? c.scheduledAt.toDate() > now : true)
  ).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white font-outfit tracking-tight">
            {t('consultations.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t('consultations.subtitle')}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setShowScheduleModal(true)}>
          <Plus size={18} />
          {t('consultations.schedule')}
        </Button>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <>
            {/* Org Picker if no org selected */}
            {!selectedOrg ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={e => e.target === e.currentTarget && setShowScheduleModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
                >
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                    Select Client Organization
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {organizations.map(org => (
                      <button
                        key={org.id}
                        onClick={() => setSelectedOrg(org)}
                        className="w-full p-3 text-start rounded-xl border border-surface-200 dark:border-surface-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <p className="font-bold text-surface-900 dark:text-white">{org.name}</p>
                        {org.industry && <p className="text-sm text-surface-500">{org.industry}</p>}
                      </button>
                    ))}
                    {organizations.length === 0 && (
                      <p className="text-center text-surface-500 py-4">
                        {t('consultations.empty.noClientOrganizations')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="mt-4 w-full py-2 text-surface-500 hover:text-surface-700 text-sm font-medium"
                  >
                    {t('consultations.cancel')}
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <ScheduleConsultationForm
                orgId={selectedOrg.id}
                orgName={selectedOrg.name}
                onClose={() => {
                  setShowScheduleModal(false);
                  setSelectedOrg(null);
                }}
                onSuccess={() => {
                  // Refresh will happen automatically via subscription
                }}
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-surface-900 dark:text-white">
                {upcomingCount}
              </p>
              <p className="text-xs text-surface-500 font-medium">
                {t('consultations.stats.upcoming')}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-surface-900 dark:text-white">
                {consultationsData.filter(c => c.status === CONSULTATION_STATUS.COMPLETED).length}
              </p>
              <p className="text-xs text-surface-500 font-medium">
                {t('consultations.stats.completed')}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-surface-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-surface-900 dark:text-white">
                {consultationsData.filter(c => c.status === CONSULTATION_STATUS.CANCELED).length}
              </p>
              <p className="text-xs text-surface-500 font-medium">
                {t('consultations.stats.canceled')}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-surface-900 dark:text-white">
                {consultationsData.length}
              </p>
              <p className="text-xs text-surface-500 font-medium">
                {t('consultations.stats.total')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute start-4 top-1/2 -translate-y-1/2 text-surface-400"
            size={18}
          />
          <input
            type="text"
            placeholder={t('consultations.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="portal-input ps-12 w-full"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['all', 'scheduled', 'completed', 'canceled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as ConsultationStatus | 'all')}
              className={cn(
                'px-4 py-2.5 min-h-[40px] rounded-xl text-sm font-bold transition-all touch-manipulation active:scale-95 shrink-0 whitespace-nowrap',
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              )}
            >
              {status === 'all' ? t('common.all') : t(`consultations.status.${status}` as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-bold text-surface-700 dark:text-surface-300 mb-2">
            {t('consultations.empty.title')}
          </h3>
          <p className="text-surface-500 text-sm">
            {t('consultations.empty.description') ||
              'Schedule your first consultation to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredConsultations.map((consultation, index) => {
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
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-5 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        typeConfig.bgColor
                      )}
                    >
                      <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-surface-900 dark:text-white truncate">
                            {consultation.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
                            <span className="flex items-center gap-1">
                              <Building2 size={14} />
                              {orgNames[consultation.orgId] || t('common.loading')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {format(scheduledDate, 'MMM d, yyyy', { locale: dateLocale })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {format(scheduledDate, 'HH:mm', { locale: dateLocale })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {consultation.duration} {t('consultations.minutes')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-bold',
                              statusConfig.bgColor,
                              statusConfig.color
                            )}
                          >
                            {t(`consultations.status.${consultation.status}`)}
                          </span>
                          {consultation.externalCalendarLink && (
                            <a
                              href={consultation.externalCalendarLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Video size={16} className="text-blue-600" />
                            </a>
                          )}
                          {consultation.status === CONSULTATION_STATUS.SCHEDULED && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleComplete(consultation)}
                                disabled={
                                  isCompleting &&
                                  completeMutation.variables?.consultationId === consultation.id
                                }
                                className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                                title="Mark as completed"
                              >
                                {isCompleting &&
                                completeMutation.variables?.consultationId === consultation.id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 size={16} className="text-green-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCancel(consultation)}
                                disabled={
                                  isCanceling &&
                                  cancelMutation.variables?.consultationId === consultation.id
                                }
                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                title={t('consultations.cancel')}
                              >
                                {isCanceling &&
                                cancelMutation.variables?.consultationId === consultation.id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <XCircle size={16} className="text-red-600" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {consultation.description && (
                        <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                          {consultation.description}
                        </p>
                      )}
                      {consultation.meetingNotes && (
                        <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                          <p className="text-xs font-bold text-surface-500 mb-1">Meeting Notes</p>
                          <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-2">
                            {consultation.meetingNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
