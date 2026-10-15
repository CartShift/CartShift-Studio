import 'server-only';
import type { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';

const ALLOWED_AGENCY_ROLES = new Set(['owner', 'admin', 'sales_manager', '']);

export async function requireAgencySession(request?: NextRequest): Promise<{ uid: string; email?: string }> {
  const session = await getServerSession(request);
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  if (!adminDb) {
    throw new Error('ADMIN_NOT_CONFIGURED');
  }

  const userSnapshot = await adminDb.collection('portal_users').doc(session.uid).get();
  const user = userSnapshot.data();
  const isAgency = user?.isAgency === true || user?.accountType === 'AGENCY';
  const role = typeof user?.agencyRole === 'string' ? user.agencyRole : '';

  if (!isAgency || !ALLOWED_AGENCY_ROLES.has(role)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}
