'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/utils/query-keys';
import type { Request } from '@/lib/types/portal';

type RequirementStatus = NonNullable<Request['proposalRequirementStatuses']>[string];

export function useProposalRequirements(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requirementId, status }: { requirementId: string; status: RequirementStatus }) => {
      const response = await fetch(`/api/portal/requests/${encodeURIComponent(requestId)}/requirements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId, status }),
      });
      if (!response.ok) throw new Error('Could not update requirement');
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pricing.detail(requestId) }),
      ]);
    },
  });
}
