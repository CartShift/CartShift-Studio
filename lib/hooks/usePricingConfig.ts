'use client';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RequestPricingConfig } from '@/components/portal/pricing/RequestPricingCalculator';
import {
  applyRequestPricingModifiers,
  getRequestPricingConfig,
  removeRequestPricingConfig,
  upsertRequestPricingConfig,
} from '@/lib/services/portal-pricing-config';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/utils/query-keys';

export function usePricingConfig(orgId: string, requestId: string) {
  return useQuery({
    queryKey: queryKeys.pricing.config(orgId, requestId),
    queryFn: () => getRequestPricingConfig(orgId, requestId),
    staleTime: 1000 * 60 * 5,
    enabled: !!orgId && !!requestId,
  });
}

export function useUpdatePricingConfig(orgId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.pricing.toast');

  return useMutation({
    mutationFn: async ({
      requestId,
      config,
    }: {
      requestId: string;
      config: Partial<RequestPricingConfig>;
    }) => upsertRequestPricingConfig(orgId, requestId, config),

    onMutate: async ({ requestId, config }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pricing.config(orgId, requestId) });

      const previousConfig =
        queryClient.getQueryData<RequestPricingConfig | null>(
          queryKeys.pricing.config(orgId, requestId)
        ) ?? undefined;

      queryClient.setQueryData(
        queryKeys.pricing.config(orgId, requestId),
        (old: RequestPricingConfig | null | undefined) => {
          if (!old) return { ...config, requestId } as RequestPricingConfig;
          return { ...old, ...config };
        }
      );

      return { previousConfig };
    },

    onError: (_error, variables, context) => {
      if (context?.previousConfig !== undefined) {
        queryClient.setQueryData(
          queryKeys.pricing.config(orgId, variables.requestId),
          context.previousConfig
        );
      }
      toast.error(t('configUpdateFailed'));
    },

    onSuccess: () => {
      toast.success(t('configUpdated'));
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pricing.config(orgId, variables.requestId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.results(orgId) });
    },
  });
}

export function useApplyGlobalModifiers(orgId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.pricing.toast');

  return useMutation({
    mutationFn: async ({
      requestIds,
      modifiers,
    }: {
      requestIds: string[];
      modifiers: Partial<RequestPricingConfig>;
    }) => {
      await applyRequestPricingModifiers(orgId, requestIds, modifiers);
      return { requestIds, modifiers };
    },

    onMutate: async ({ requestIds, modifiers }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pricing.config(orgId) });

      const previousConfigs = requestIds.map(id => ({
        id,
        data: queryClient.getQueryData<RequestPricingConfig | null>(
          queryKeys.pricing.config(orgId, id)
        ),
      }));

      requestIds.forEach(id => {
        queryClient.setQueryData(
          queryKeys.pricing.config(orgId, id),
          (old: RequestPricingConfig | null | undefined) => {
            if (!old) return undefined;
            return { ...old, ...modifiers };
          }
        );
      });

      return { previousConfigs };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousConfigs) {
        context.previousConfigs.forEach(({ id, data }) => {
          if (data !== undefined) {
            queryClient.setQueryData(queryKeys.pricing.config(orgId, id), data);
          }
        });
      }
      toast.error(t('modifiersApplyFailed'));
    },

    onSuccess: () => {
      toast.success(t('modifiersApplied'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.config(orgId) });
    },
  });
}

export function useRemovePricingConfig(orgId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.pricing.toast');

  return useMutation({
    mutationFn: async (requestId: string) => {
      await removeRequestPricingConfig(orgId, requestId);
      return requestId;
    },

    onMutate: async requestId => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pricing.config(orgId, requestId) });
      const previousConfig = queryClient.getQueryData<RequestPricingConfig | null>(
        queryKeys.pricing.config(orgId, requestId)
      );

      queryClient.removeQueries({ queryKey: queryKeys.pricing.config(orgId, requestId) });

      return { previousConfig, requestId };
    },

    onError: (_error, requestId, context) => {
      if (context?.previousConfig !== undefined) {
        queryClient.setQueryData(
          queryKeys.pricing.config(orgId, requestId),
          context.previousConfig
        );
      }
      toast.error(t('configRemoveFailed'));
    },

    onSuccess: () => {
      toast.success(t('configRemoved'));
    },

    onSettled: (_data, _error, requestId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.config(orgId, requestId) });
    },
  });
}
