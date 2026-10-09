import {
  collection, documentId, getCountFromServer, getDocs, limit, orderBy, query, startAfter,
  Timestamp, where, type QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { getPortalUser } from '@/lib/services/portal-users';
import type { Request, RequestStatus } from '@/lib/types/portal';

export type RequestPageCursor = Readonly<{
  seconds: number;
  nanoseconds: number;
  id: string;
}>;
export type RequestPageResult = {
  items: Request[];
  nextCursor: RequestPageCursor | null;
  hasMore: boolean;
};

export type RequestPageOptions = {
  orgId?: string;
  statuses?: readonly RequestStatus[];
  pageSize?: number;
  cursor?: RequestPageCursor | null;
};

/** Fetch limited pages without silently truncating existing dashboard streams. */
export async function getPortalRequestPage(
  options: RequestPageOptions,
): Promise<RequestPageResult> {
  await waitForAuth();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('UNAUTHENTICATED');

  if (!options.orgId) {
    const userData = await getPortalUser(user.uid);
    if (!userData || (userData.accountType !== 'AGENCY' && userData.isAgency !== true)) {
      throw new Error('FORBIDDEN');
    }
  }

  const size = normalizeRequestPageSize(options.pageSize);
  const constraints: QueryConstraint[] = [];
  if (options.orgId) constraints.push(where('orgId', '==', options.orgId));
  if (options.statuses?.length) {
    const statuses = [...new Set(options.statuses)];
    if (statuses.length > 30) throw new Error('INVALID_STATUS_FILTER');
    constraints.push(where('status', 'in', statuses));
  }
  constraints.push(orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'));
  if (options.cursor) {
    assertRequestCursor(options.cursor);
    constraints.push(startAfter(
      new Timestamp(options.cursor.seconds, options.cursor.nanoseconds),
      options.cursor.id,
    ));
  }
  constraints.push(limit(size + 1));

  const snapshot = await getDocs(query(collection(getFirestoreDb(), 'portal_requests'), ...constraints));
  const docs = snapshot.docs.slice(0, size);
  const last = docs.at(-1);
  const timestamp = last?.data()?.createdAt;
  const hasMore = snapshot.docs.length > size;
  if (hasMore && !(timestamp instanceof Timestamp)) {
    throw new Error('INVALID_REQUEST_CURSOR');
  }
  return {
    items: docs.map(doc => ({ id: doc.id, ...doc.data() } as Request)),
    hasMore,
    nextCursor: hasMore && last && timestamp instanceof Timestamp
      ? { id: last.id, seconds: timestamp.seconds, nanoseconds: timestamp.nanoseconds }
      : null,
  };
}

export function normalizeRequestPageSize(value?: number): number {
  if (value === undefined) return 30;
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error('INVALID_PAGE_SIZE');
  }
  return value;
}

export function assertRequestCursor(cursor: RequestPageCursor): void {
  if (!Number.isSafeInteger(cursor.seconds) ||
      !Number.isInteger(cursor.nanoseconds) || cursor.nanoseconds < 0 ||
      cursor.nanoseconds >= 1_000_000_000 ||
      typeof cursor.id !== 'string' || !cursor.id ||
      cursor.id.length > 1500 || cursor.id.includes('/') ||
      cursor.id === '.' || cursor.id === '..') {
    throw new Error('INVALID_REQUEST_CURSOR');
  }
}

/**
 * Read-only Firestore aggregation counts. No request document payloads are
 * downloaded merely to render overview numbers.
 */
export async function getPortalRequestCountStats(orgId: string): Promise<{
  total: number;
  active: number;
  inReview: number;
  completed: number;
}> {
  await waitForAuth();
  if (!getFirebaseAuth().currentUser) throw new Error('UNAUTHENTICATED');
  if (!orgId) throw new Error('INVALID_ORGANIZATION');

  const collectionRef = collection(getFirestoreDb(), 'portal_requests');
  const scoped = where('orgId', '==', orgId);
  const [total, active, inReview, completed] = await Promise.all([
    getCountFromServer(query(collectionRef, scoped)),
    getCountFromServer(query(collectionRef, scoped, where('status', 'in', ['NEW', 'QUEUED', 'IN_PROGRESS']))),
    getCountFromServer(query(collectionRef, scoped, where('status', '==', 'IN_REVIEW'))),
    getCountFromServer(query(collectionRef, scoped, where('status', 'in', ['DELIVERED', 'CLOSED', 'PAID']))),
  ]);
  return {
    total: total.data().count,
    active: active.data().count,
    inReview: inReview.data().count,
    completed: completed.data().count,
  };
}
