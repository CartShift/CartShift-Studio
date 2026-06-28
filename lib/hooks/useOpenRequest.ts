'use client';

import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useRequestPreview } from '@/lib/context/RequestPreviewContext';
import { useOrg } from '@/lib/context/OrgContext';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface OpenRequestOptions {
  /** Open full page instead of preview modal */
  fullPage?: boolean;
  /** Organization to switch to before opening (agency) */
  orgId?: string;
}

/**
 * Shared hook for opening requests from any portal entry point.
 * Defaults to preview modal overlay; pass fullPage for direct navigation.
 */
export function useOpenRequest() {
  const { openRequestPreview, closeRequestPreview, expandRequestPreview } = useRequestPreview();
  const { switchOrg } = useOrg();
  const { isAgency } = usePortalAuth();
  const router = useRouter();

  const openRequest = useCallback(
    (requestId: string, options?: OpenRequestOptions) => {
      const orgId = options?.orgId;

      if (options?.fullPage) {
        if (isAgency && orgId) {
          switchOrg(orgId);
        }
        router.push(getPortalPath(`/requests/${requestId}/`));
        return;
      }

      openRequestPreview(requestId, orgId);
    },
    [isAgency, switchOrg, router, openRequestPreview]
  );

  return {
    openRequest,
    closeRequestPreview,
    expandRequestPreview,
  };
}
