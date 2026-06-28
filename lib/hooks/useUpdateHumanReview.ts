'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHumanReview, type ReviewVisibility } from '@/lib/services/portal-marketing';
import { queryKeys } from '@/lib/utils/query-keys';

export function useUpdateHumanReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      requestId: string;
      reviewVisibility?: ReviewVisibility;
      qualified?: boolean;
      status?: string;
    }) => updateHumanReview(input.requestId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.marketing.dashboard }),
  });
}
