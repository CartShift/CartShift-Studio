'use client';

import { useOrg } from '@/lib/context/OrgContext';

/**
 * Hook to resolve the current organization ID.
 *
 * This hook now uses the OrgContext to get the current organization ID,
 * which is stored in session storage instead of the URL.
 *
 * This approach provides cleaner URLs while still supporting multi-org.
 *
 * @returns The current organization ID, or null if not yet resolved or not in an org context
 * @deprecated Consider using useOrg() or useOrgId() directly from '@/lib/context' for new code
 */
export function useResolvedOrgId(): string | null {
  const { orgId } = useOrg();
  return orgId;
}
