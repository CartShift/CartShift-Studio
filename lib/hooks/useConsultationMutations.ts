import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelConsultation, completeConsultation } from '@/lib/services/portal-consultations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/utils/query-keys';

export function useConsultationMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal');

  const cancelMutation = useMutation({
    mutationFn: (vars: {
      consultationId: string;
      orgId: string;
      userId: string;
      userName: string;
      reason?: string;
    }) =>
      cancelConsultation(vars.consultationId, vars.orgId, vars.userId, vars.userName, vars.reason),
    onSuccess: () => {
      toast.success(t('consultations.form.cancelSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.consultations.byOrg() });
      queryClient.invalidateQueries({ queryKey: queryKeys.consultations.all() });
    },
    onError: error => {
      console.error('Failed to cancel consultation:', error);
      toast.error(t('consultations.form.failedToCancel'));
    },
  });

  const completeMutation = useMutation({
    mutationFn: (vars: {
      consultationId: string;
      orgId: string;
      userId: string;
      userName: string;
      meetingNotes?: string;
      actionItems?: string[];
    }) =>
      completeConsultation(
        vars.consultationId,
        vars.orgId,
        vars.userId,
        vars.userName,
        vars.meetingNotes,
        vars.actionItems
      ),
    onSuccess: () => {
      toast.success(t('consultations.form.completeSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.consultations.byOrg() });
      queryClient.invalidateQueries({ queryKey: queryKeys.consultations.all() });
    },
    onError: error => {
      console.error('Failed to complete consultation:', error);
      toast.error(t('consultations.form.failedToComplete'));
    },
  });

  return {
    cancelMutation,
    cancelConsultation: cancelMutation.mutate,
    cancelConsultationAsync: cancelMutation.mutateAsync,
    isCanceling: cancelMutation.isPending,
    completeMutation,
    completeConsultation: completeMutation.mutate,
    completeConsultationAsync: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
  };
}
