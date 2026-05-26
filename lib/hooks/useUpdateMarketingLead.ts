'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMarketingLeadContactStatus } from '@/lib/services/portal-marketing';
import { queryKeys } from '@/lib/utils/query-keys';

export function useUpdateMarketingLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { leadId: string; contactStatus: 'contacted' | 'pending' }) =>
      updateMarketingLeadContactStatus(params.leadId, params.contactStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.marketing.dashboard });
    },
  });
}
