import type { PortalSessionContext } from '@/lib/server/portal-session-context';
import type { Request } from '@/lib/types/portal';

/**
 * Admin SDK bypasses Firestore Security Rules. Never dehydrate a request until
 * the authenticated user has passed an explicit tenant authorization check.
 */
export function canPrefetchPortalRequest(
  context: Pick<PortalSessionContext, 'uid' | 'email' | 'isAgency' | 'organizations'>,
  request: Pick<Request, 'orgId' | 'createdBy' | 'clientUserId' | 'clientEmail'>,
  hasRevokedMembership: boolean,
): boolean {
  if (context.isAgency) return true;
  if (hasRevokedMembership) return false;
  if (context.organizations.includes(request.orgId)) return true;
  if (request.createdBy === context.uid || request.clientUserId === context.uid) return true;
  const email = context.email?.trim().toLowerCase();
  return Boolean(email && request.clientEmail?.trim().toLowerCase() === email);
}
