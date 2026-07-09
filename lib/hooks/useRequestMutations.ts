'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRequest } from '@/lib/services/portal-requests';
import { invalidatePortalRequestData } from '@/lib/utils/portal-cache-invalidation';
import type { CreateRequestData, Request } from '@/lib/types/portal';

export function useRequestMutations(orgId?: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({
      targetOrgId,
      userId,
      userName,
      data,
    }: {
      targetOrgId: string;
      userId: string;
      userName: string;
      data: CreateRequestData;
    }): Promise<Request> => createRequest(targetOrgId, userId, userName, data),
    onSuccess: request => {
      invalidatePortalRequestData(queryClient, {
        orgId: request.orgId ?? orgId,
        requestId: request.id,
      });
    },
  });

  return {
    createRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
