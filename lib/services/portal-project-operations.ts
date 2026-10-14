import {
  addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import {
  initialProjectRecordStatus, validateProjectPrivateRecord, validProjectRecordTransition,
  type NewProjectPrivateRecord, type ProjectPrivateRecord, type ProjectRecordStatus,
} from '@/lib/domain/project-operations';

const recordCollection = (projectId: string) =>
  collection(getFirestoreDb(), 'portal_projects', projectId, 'private_records');

async function agencyUser() {
  await waitForAuth();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Not authenticated');
  // Agency permissions are also enforced by Firestore rules on EVERY operation.
  return user;
}

/** Only agency staff can read the private subcollection; customers cannot enumerate it. */
export async function listProjectPrivateRecords(projectId: string): Promise<ProjectPrivateRecord[]> {
  await agencyUser();
  const snapshot = await getDocs(query(recordCollection(projectId), orderBy('createdAt', 'desc'), limit(100)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProjectPrivateRecord));
}

export async function addProjectPrivateRecord(
  projectId: string, input: NewProjectPrivateRecord
): Promise<string> {
  const user = await agencyUser();
  const invalid = validateProjectPrivateRecord(input);
  if (invalid) throw new Error(invalid);
  const result = await addDoc(recordCollection(projectId), {
    kind: input.kind,
    title: input.title.trim(),
    details: input.details.trim(),
    status: initialProjectRecordStatus(input.kind),
    sourceUrl: input.sourceUrl?.trim() || '',
    owner: input.owner?.trim() || '',
    dueDate: input.dueDate || '',
    ...(input.kind === 'time' ? { hours: input.hours } : {}),
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return result.id;
}

/** Evidence fields are immutable: changed outcomes are audited via a new record. */
export async function updateProjectPrivateRecordStatus(
  projectId: string, record: Pick<ProjectPrivateRecord, 'id' | 'kind'>, status: ProjectRecordStatus
): Promise<void> {
  await agencyUser();
  if (!validProjectRecordTransition(record.kind, status)) throw new Error('Invalid record status');
  if (record.kind === 'time') throw new Error('Time evidence cannot be modified');
  await updateDoc(doc(recordCollection(projectId), record.id), {
    status, updatedAt: serverTimestamp(),
  });
}
