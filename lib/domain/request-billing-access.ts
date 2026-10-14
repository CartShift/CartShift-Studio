/**
 * Authorization predicate for the server-owned billing ledger.
 *
 * A mutable portal_users.email is not an identity proof: use only Firebase
 * verified identity claims for the legacy email-only fallback.
 * Agency authorization and membership state are resolved server-side.
 */
export interface RequestBillingAccess {
  uid: string;
  isAgency: boolean;
  hasOrgMembership: boolean;
  revokedMembership: boolean;
  verifiedEmail?: string | null;
  request: {
    createdBy?: string | null;
    clientUserId?: string | null;
    clientEmail?: string | null;
  };
}

export function canAccessRequestBilling(input: RequestBillingAccess): boolean {
  if (input.isAgency) return true;
  // A revoked member must not retain ledger access via the request owner fallback.
  if (input.hasOrgMembership) return !input.revokedMembership;
  if (input.uid === input.request.createdBy || input.uid === input.request.clientUserId) {
    return true;
  }

  const email = input.verifiedEmail?.trim().toLowerCase();
  const target = input.request.clientEmail?.trim().toLowerCase();
  return Boolean(email && target && email === target);
}
