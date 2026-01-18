'use client';

import { useParams } from 'next/navigation';

/**
 * Hook to get the request ID from URL params.
 */
export function useResolvedRequestId(): string | null {
  const params = useParams();
  const requestId = params?.requestId;
  return typeof requestId === 'string' ? requestId : null;
}
