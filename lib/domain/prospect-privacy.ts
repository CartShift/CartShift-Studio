import { normalizeProspectStoreUrl } from '@/lib/domain/prospects';

/** Suppression must survive erasure so duplicate imports cannot resume research. */
export function minimalSuppressedProspect(canonicalDomain: string) {
  const normalized = normalizeProspectStoreUrl(canonicalDomain);
  if (normalized.canonicalDomain !== canonicalDomain) throw new Error('INVALID_DOMAIN');
  return {
    canonicalDomain,
    storeUrl: normalized.storeUrl,
    doNotContact: true,
    stage: 'suppressed' as const,
    outreachEligibility: 'blocked' as const,
    redactionState: 'completed' as const,
    verifiedIssueCount: 0,
  };
}
