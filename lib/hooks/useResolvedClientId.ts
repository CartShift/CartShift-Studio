'use client';

import { useParams } from 'next/navigation';

/**
 * Hook to get the client ID from URL params.
 */
export function useResolvedClientId(): string | null {
  const params = useParams();
  const clientId = params?.clientId;
  return typeof clientId === 'string' ? clientId : null;
}
