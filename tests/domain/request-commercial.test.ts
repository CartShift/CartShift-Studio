import { describe, expect, it } from 'vitest';
import {
  canAcceptCommercialRequest,
  getCanonicalRequestIdentity,
  getLegacyLinkedRequestIds,
  getRequestRole,
  mapLegacyProposalStatus,
} from '@/lib/domain/request-commercial';

describe('request commercial domain', () => {
  it('maps legacy proposal statuses into the request lifecycle', () => {
    expect(mapLegacyProposalStatus('SENT')).toBe('QUOTED');
    expect(mapLegacyProposalStatus('CLIENT_EDITED')).toBe('CHANGES_REQUESTED');
    expect(mapLegacyProposalStatus('EXPIRED')).toBe('EXPIRED');
  });

  it('reuses a single linked request and creates a parent only for bundles', () => {
    expect(getCanonicalRequestIdentity('proposal-1', { requestIds: [] })).toEqual({
      requestId: 'proposal-1',
      requestRole: 'standalone',
      childRequestIds: [],
    });
    expect(getCanonicalRequestIdentity('proposal-2', { requestIds: ['request-1'] })).toEqual({
      requestId: 'request-1',
      requestRole: 'standalone',
      childRequestIds: [],
    });
    expect(
      getCanonicalRequestIdentity('proposal-3', { requestIds: ['request-1', 'request-2'] })
    ).toEqual({
      requestId: 'proposal-3',
      requestRole: 'bundle',
      childRequestIds: ['request-1', 'request-2'],
    });
  });

  it('deduplicates materialized and linked child ids', () => {
    expect(
      getLegacyLinkedRequestIds({
        materializedRequestIds: ['request-1', 'request-2'],
        requestIds: ['request-2', 'request-3'],
      })
    ).toEqual(['request-1', 'request-2', 'request-3']);
  });

  it('derives hierarchy roles for pre-role documents', () => {
    expect(getRequestRole({ parentRequestId: 'parent' })).toBe('bundle_item');
    expect(getRequestRole({ childRequestIds: ['child'] })).toBe('bundle');
    expect(getRequestRole({})).toBe('standalone');
  });

  it('only accepts active quoted requests', () => {
    expect(canAcceptCommercialRequest({ status: 'QUOTED' })).toBe(true);
    expect(canAcceptCommercialRequest({ status: 'DRAFT' })).toBe(false);
    expect(
      canAcceptCommercialRequest(
        { status: 'QUOTED', validUntil: { toDate: () => new Date(1) } as never },
        2
      )
    ).toBe(false);
  });
});
