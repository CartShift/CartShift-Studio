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

/**
 * Full Firestore request snapshots may include unpublished proposal content,
 * private notes and ledger metadata. Only an agency role may hydrate them.
 * Client access to a request does not imply access to its raw representation.
 */
export function canDehydrateFullRequest(
  context: Pick<PortalSessionContext, 'uid' | 'email' | 'isAgency' | 'organizations'>,
  request: Pick<Request, 'orgId' | 'createdBy' | 'clientUserId' | 'clientEmail'>,
  revoked: boolean,
): boolean {
  return context.isAgency && canPrefetchPortalRequest(context, request, revoked);
}

// A pre-assigned email recipient may see the request itself, not the private
// organization activity stream before becoming an active tenant member.
export function canPrefetchRequestActivities(
  context: Pick<PortalSessionContext, 'isAgency' | 'organizations'>,
  requestOrgId: string,
): boolean {
  return context.isAgency || context.organizations.includes(requestOrgId);
}
