'use client';

import { getFirebaseAuth } from '@/lib/firebase';
import type { WorkMode } from '@/lib/domain/work-engagement';
import type { AgencyClientWorkMode } from '@/lib/types/portal';

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  if (!token) throw new Error('UNAUTHENTICATED');
  const response = await fetch('/api/portal/agency/' + path, {
    method,
    headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || 'Unable to update work mode');
  }
  return response.json() as Promise<T>;
}

export async function listAgencyClientWorkModes(): Promise<AgencyClientWorkMode[]> {
  return (await request<{ modes: AgencyClientWorkMode[] }>('client-work-modes')).modes;
}

export function getAgencyClientWorkMode(orgId: string): Promise<AgencyClientWorkMode> {
  return request<AgencyClientWorkMode>('client-work-modes?orgId=' + encodeURIComponent(orgId));
}

export function saveAgencyClientWorkMode(input: AgencyClientWorkMode): Promise<AgencyClientWorkMode> {
  return request<AgencyClientWorkMode>('client-work-modes', 'PATCH', input);
}

export function saveAgencyProjectWorkMode(
  orgId: string, projectId: string, workMode: WorkMode,
): Promise<{ projectId: string; workMode: WorkMode }> {
  return request('project-work-mode', 'PATCH', { orgId, projectId, workMode });
}
