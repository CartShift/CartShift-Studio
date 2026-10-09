type AgencyActor = {
  isAgency?: boolean;
  accountType?: string;
  agencyRole?: string;
} | undefined;

type Membership = {
  role?: string;
  removedAt?: unknown;
} | undefined;

/**
 * Authorization shared by server membership commands.
 * A revoked organization creator cannot regain administrator rights implicitly.
 */
export function canRemoveOrganizationMember(
  actorUid: string,
  actor: AgencyActor,
  orgCreatedBy: string | undefined,
  actorMembership: Membership,
): boolean {
  const isAgency = actor?.isAgency === true || actor?.accountType === 'AGENCY';
  if (isAgency && new Set(['owner', 'admin', 'sales_manager', '']).has(actor?.agencyRole ?? '')) {
    return true;
  }

  if (actorMembership?.removedAt) return false;
  if (orgCreatedBy === actorUid) return true;
  return actorMembership?.role === 'owner' || actorMembership?.role === 'admin';
}
