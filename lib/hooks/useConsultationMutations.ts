import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelConsultation, completeConsultation } from '@/lib/services/portal-consultations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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
      toast.success(t('consultations.form.cancelSuccess' as any));
      queryClient.invalidateQueries({ queryKey: ['org-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['all-consultations'] });
    },
    onError: error => {
      console.error('Failed to cancel consultation:', error);
      toast.error(t('consultations.form.failedToCancel' as any));
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
      toast.success(t('consultations.form.completeSuccess' as any));
      queryClient.invalidateQueries({ queryKey: ['org-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['all-consultations'] });
    },
    onError: error => {
      console.error('Failed to complete consultation:', error);
      toast.error(t('consultations.form.failedToComplete' as any));
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
