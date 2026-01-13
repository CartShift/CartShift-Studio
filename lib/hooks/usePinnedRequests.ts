'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { togglePinRequest, isRequestPinnedByUser } from '@/lib/services/portal-requests';
import { usePortalAuth } from './usePortalAuth';
import { useRequests } from './useRequests';
import { useResolvedOrgId } from './useResolvedOrgId';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Request } from '@/lib/types/portal';

// Shared loading state across all hook instances
const globalLoadingRequestIds = new Set<string>();
const loadingStateListeners = new Set<() => void>();

function notifyLoadingStateChange() {
  loadingStateListeners.forEach(listener => listener());
}

/**
 * Hook for managing pinned requests per user.
 * Uses Firestore for persistence - consistent across devices.
 *
 * The pinnedBy field is stored on each Request document as an array of user IDs.
 */
export function usePinnedRequests(_orgId?: string) {
  const { userData, isAgency } = usePortalAuth();
  const { requests } = useRequests();
  const resolvedOrgId = useResolvedOrgId();
  const orgId = _orgId || resolvedOrgId;
  const userId = userData?.id;
  const queryClient = useQueryClient();

  // Sync with global loading state
  useEffect(() => {
    const listener = () => {
      // Trigger re-render when loading state changes
    };
    loadingStateListeners.add(listener);
    return () => {
      loadingStateListeners.delete(listener);
    };
  }, []);

  // Derive pinned IDs from requests data (real-time via Firestore subscription)
  const pinnedIds = useMemo(() => {
    if (!userId || !requests) return [];
    return requests
      .filter(req => req.pinnedBy?.includes(userId))
      .map(req => req.id);
  }, [requests, userId]);

  const togglePin = useCallback(async (requestId: string) => {
    if (!userId) {
      console.warn('[usePinnedRequests] Cannot toggle pin: user not authenticated');
      return;
    }

    // Get current request to determine current state
    const currentRequest = requests?.find(r => r.id === requestId);
    if (!currentRequest) return;

    const currentPinnedState = isRequestPinnedByUser(currentRequest, userId);
    const optimisticPinnedState = !currentPinnedState;

    // Set loading state immediately (shared across all instances)
    globalLoadingRequestIds.add(requestId);
    notifyLoadingStateChange();

    // Small delay to ensure loading state is visible
    await new Promise(resolve => setTimeout(resolve, 50));

    // Optimistically update the cache
    const queryKey = isAgency ? ['all-requests'] : ['org-requests', orgId];
    queryClient.setQueryData<Request[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(req => {
        if (req.id === requestId) {
          const pinnedBy = req.pinnedBy || [];
          if (optimisticPinnedState) {
            // Add userId if not present
            return {
              ...req,
              pinnedBy: pinnedBy.includes(userId) ? pinnedBy : [...pinnedBy, userId],
            };
          } else {
            // Remove userId
            return {
              ...req,
              pinnedBy: pinnedBy.filter(id => id !== userId),
            };
          }
        }
        return req;
      });
    });

    try {
      await togglePinRequest(requestId, userId);

      // Invalidate queries to sync with server
      if (isAgency) {
        queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['org-requests'] });
      }

      // Toast feedback disabled - using visual animation instead
      // if (newPinnedState) {
      //   toast.success('Request pinned');
      // } else {
      //   toast.success('Request unpinned');
      // }
    } catch (error) {
      console.error('[usePinnedRequests] Failed to toggle pin:', error);

      // Revert optimistic update on error
      queryClient.setQueryData<Request[]>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(req => {
          if (req.id === requestId) {
            const pinnedBy = req.pinnedBy || [];
            if (currentPinnedState) {
              // Restore pinned state
              return {
                ...req,
                pinnedBy: pinnedBy.includes(userId) ? pinnedBy : [...pinnedBy, userId],
              };
            } else {
              // Restore unpinned state
              return {
                ...req,
                pinnedBy: pinnedBy.filter(id => id !== userId),
              };
            }
          }
          return req;
        });
      });

      toast.error('Failed to update pin status');
    } finally {
      // Clear loading state (shared across all instances)
      globalLoadingRequestIds.delete(requestId);
      notifyLoadingStateChange();
    }
  }, [userId, isAgency, queryClient, requests, orgId]);

  const isPinned = useCallback(
    (requestId: string) => {
      return pinnedIds.includes(requestId);
    },
    [pinnedIds]
  );

  const pinRequest = useCallback(async (requestId: string) => {
    if (!userId) return;
    // Only pin if not already pinned
    const request = requests?.find(r => r.id === requestId);
    if (request && !isRequestPinnedByUser(request, userId)) {
      await togglePin(requestId);
    }
  }, [userId, requests, togglePin]);

  const unpinRequest = useCallback(async (requestId: string) => {
    if (!userId) return;
    // Only unpin if currently pinned
    const request = requests?.find(r => r.id === requestId);
    if (request && isRequestPinnedByUser(request, userId)) {
      await togglePin(requestId);
    }
  }, [userId, requests, togglePin]);

  const isPinning = useCallback(
    (requestId: string) => {
      return globalLoadingRequestIds.has(requestId);
    },
    []
  );

  return useMemo(() => ({
    pinnedIds,
    togglePin,
    isPinned,
    isPinning,
    pinRequest,
    unpinRequest,
    pinnedCount: pinnedIds.length,
    loadingRequestIds: globalLoadingRequestIds, // Expose shared state
  }), [pinnedIds, togglePin, isPinned, isPinning, pinRequest, unpinRequest]);
}
