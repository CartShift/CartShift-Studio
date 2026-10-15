'use client';

import { Timestamp } from 'firebase/firestore';
import { getFirebaseAuth, waitForAuth } from '@/lib/firebase';
import type { Request } from '@/lib/types/portal';

function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj._seconds === 'number' && typeof obj._nanoseconds === 'number') {
      return new Timestamp(obj._seconds, obj._nanoseconds);
    }
    if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number' &&
        Object.keys(obj).every(key => ['seconds', 'nanoseconds'].includes(key))) {
      return new Timestamp(obj.seconds, obj.nanoseconds);
    }
    return Object.fromEntries(Object.entries(obj).map(([key, item]) => [key, reviveDates(item)]));
  }
  return value;
}

async function read<T>(path: string): Promise<T> {
  await waitForAuth();
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  if (!token) throw new Error('UNAUTHENTICATED');
  const response = await fetch(path, {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('CLIENT_REQUESTS_' + response.status);
  return reviveDates(await response.json()) as T;
}

export async function getClientVisibleRequests(orgId: string, projectId?: string): Promise<Request[]> {
  const params = new URLSearchParams({ orgId });
  if (projectId) params.set('projectId', projectId);
  const result = await read<{ items: Request[] }>('/api/portal/client-requests?' + params);
  return result.items;
}

export async function getClientVisibleRequest(requestId: string): Promise<Request | null> {
  try {
    const result = await read<{ request: Request }>('/api/portal/client-requests/' + encodeURIComponent(requestId));
    return result.request;
  } catch (error) {
    if (error instanceof Error && error.message === 'CLIENT_REQUESTS_404') return null;
    throw error;
  }
}
