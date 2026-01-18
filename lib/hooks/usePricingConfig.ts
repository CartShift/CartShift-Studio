'use client';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFirestoreDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { RequestPricingConfig } from '@/components/portal/pricing/RequestPricingCalculator';
import { toast } from 'sonner';

/**
 * Custom hook for pricing configuration with TanStack Query
 * Follows AGENTS.md pattern for Firestore interactions
 */
export function usePricingConfig(orgId: string, requestId: string) {
  const db = getFirestoreDb();

  return useQuery({
    queryKey: ['pricing-config', orgId, requestId],
    queryFn: async () => {
      const docRef = doc(db, 'organizations', orgId, 'pricing-configs', requestId);
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data() as RequestPricingConfig) : null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!orgId && !!requestId,
  });
}

/**
 * Hook for updating pricing configuration with optimistic updates
 */
export function useUpdatePricingConfig(orgId: string) {
  const queryClient = useQueryClient();
  const db = getFirestoreDb();
  const t = useTranslations('portal.pricing.toast');

  return useMutation({
    mutationFn: async ({
      requestId,
      config,
    }: {
      requestId: string;
      config: Partial<RequestPricingConfig>;
    }) => {
      const docRef = doc(db, 'organizations', orgId, 'pricing-configs', requestId);

      // Get existing config to merge
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? snap.data() : {};

      const updatedConfig = { ...existing, ...config, requestId };

      await setDoc(docRef, updatedConfig, { merge: true });
      return updatedConfig;
    },

    onMutate: async ({ requestId, config }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['pricing-config', orgId, requestId] });

      // Snapshot previous value
      const previousConfig =
        queryClient.getQueryData(['pricing-config', orgId, requestId]) ?? undefined;

      // Optimistically update
      queryClient.setQueryData(
        ['pricing-config', orgId, requestId],
        (old: RequestPricingConfig | undefined) => {
          if (!old) return config as RequestPricingConfig;
          return { ...old, ...config };
        }
      );

      return { previousConfig };
    },

    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousConfig) {
        queryClient.setQueryData(
          ['pricing-config', orgId, variables.requestId],
          context.previousConfig
        );
      }
      toast.error(t('configUpdateFailed'));
    },

    onSuccess: () => {
      toast.success(t('configUpdated'));
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['pricing-config', orgId, variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-results', orgId] });
    },
  });
}

/**
 * Hook for applying global modifiers to all requests
 */
export function useApplyGlobalModifiers(orgId: string) {
  const queryClient = useQueryClient();
  const db = getFirestoreDb();
  const t = useTranslations('portal.pricing.toast');

  return useMutation({
    mutationFn: async ({
      requestIds,
      modifiers,
    }: {
      requestIds: string[];
      modifiers: Partial<RequestPricingConfig>;
    }) => {
      const updates = requestIds.map(requestId => {
        const docRef = doc(db, 'organizations', orgId, 'pricing-configs', requestId);
        return updateDoc(docRef, modifiers);
      });

      await Promise.all(updates);
      return { requestIds, modifiers };
    },

    onMutate: async ({ requestIds, modifiers }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['pricing-config', orgId] });

      // Snapshot previous values
      const previousConfigs = requestIds.map(id => ({
        id,
        data: queryClient.getQueryData(['pricing-config', orgId, id]),
      }));

      // Optimistically update all
      requestIds.forEach(id => {
        queryClient.setQueryData(
          ['pricing-config', orgId, id],
          (old: RequestPricingConfig | undefined) => {
            if (!old) return undefined;
            return { ...old, ...modifiers };
          }
        );
      });

      return { previousConfigs };
    },

    onError: (_error, _variables, context) => {
      // Rollback all changes
      if (context?.previousConfigs) {
        context.previousConfigs.forEach(({ id, data }: { id: string; data: any }) => {
          if (data) {
            queryClient.setQueryData(['pricing-config', orgId, id], data);
          }
        });
      }
      toast.error(t('modifiersApplyFailed'));
    },

    onSuccess: () => {
      toast.success(t('modifiersApplied'));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config', orgId] });
    },
  });
}

/**
 * Hook for removing pricing configuration
 */
export function useRemovePricingConfig(orgId: string) {
  const queryClient = useQueryClient();
  const db = getFirestoreDb();
  const t = useTranslations('portal.pricing.toast');

  return useMutation({
    mutationFn: async (requestId: string) => {
      const docRef = doc(db, 'organizations', orgId, 'pricing-configs', requestId);
      await deleteDoc(docRef);
      return requestId;
    },

    onMutate: async requestId => {
      await queryClient.cancelQueries({ queryKey: ['pricing-config', orgId, requestId] });
      const previousConfig = queryClient.getQueryData(['pricing-config', orgId, requestId]);

      queryClient.removeQueries({ queryKey: ['pricing-config', orgId, requestId] });

      return { previousConfig, requestId };
    },

    onError: (_error, requestId, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['pricing-config', orgId, requestId], context.previousConfig);
      }
      toast.error(t('configRemoveFailed'));
    },

    onSuccess: () => {
      toast.success(t('configRemoved'));
    },

    onSettled: (_data, _error, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config', orgId, requestId] });
    },
  });
}
