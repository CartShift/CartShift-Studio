import { getFirebaseAuth, waitForAuth } from '@/lib/firebase';
import {
  validateProjectPrivateRecord, validProjectRecordTransition,
  type NewProjectPrivateRecord, type ProjectPrivateRecord, type ProjectRecordStatus,
} from '@/lib/domain/project-operations';

async function privateApi(projectId: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown) {
  await waitForAuth();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const response = await fetch('/api/portal/projects/' + encodeURIComponent(projectId) + '/private-records', {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: {
      Authorization: 'Bearer ' + token,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({})) as {
    items?: ProjectPrivateRecord[]; id?: string; error?: string;
  };
  if (!response.ok) throw new Error(result.error || 'Private project request failed');
  return result;
}

/** The server checks agency role on EVERY request and never shares records with clients. */
export async function listProjectPrivateRecords(projectId: string): Promise<ProjectPrivateRecord[]> {
  return (await privateApi(projectId, 'GET')).items || [];
}
export async function addProjectPrivateRecord(
  projectId: string, input: NewProjectPrivateRecord
): Promise<string> {
  const invalid = validateProjectPrivateRecord(input);
  if (invalid) throw new Error(invalid);
  const result = await privateApi(projectId, 'POST', input);
  if (!result.id) throw new Error('Missing record identifier');
  return result.id;
}
/** Evidence is immutable; only the documented result/status may change. */
export async function updateProjectPrivateRecordStatus(
  projectId: string, record: Pick<ProjectPrivateRecord, 'id' | 'kind'>, status: ProjectRecordStatus
): Promise<void> {
  if (record.kind === 'time' || !validProjectRecordTransition(record.kind, status)) {
    throw new Error('Invalid record status');
  }
  await privateApi(projectId, 'PATCH', { recordId: record.id, status });
}
