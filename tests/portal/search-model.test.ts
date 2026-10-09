import { describe, expect, it } from 'vitest';
import {
  isCommercialRequest,
  matchesPortalQuery,
  requestSearchPool,
} from '@/lib/portal/search-model';

const regular = { id: 'ticket', requestRole: 'standalone' as const };
const offer = { id: 'proposal', isBillable: true };
const bundle = { id: 'bundle', requestRole: 'bundle' as const };

describe('shared portal search model', () => {
  it('recognizes commercial requests without using URL or translated labels', () => {
    expect(isCommercialRequest(regular)).toBe(false);
    expect(isCommercialRequest(offer)).toBe(true);
    expect(isCommercialRequest(bundle)).toBe(true);
  });

  it('does not expose commercial entries to agency roles lacking permission', () => {
    expect(requestSearchPool([regular, offer, bundle], {
      isAgency: true, canViewCommercial: false, kind: 'all',
    }).map(row => row.id)).toEqual(['ticket']);
    expect(requestSearchPool([regular, offer, bundle], {
      isAgency: true, canViewCommercial: true, kind: 'commercial',
    }).map(row => row.id)).toEqual(['proposal', 'bundle']);
  });

  it('keeps client entries scoped by upstream service and supports case-insensitive search', () => {
    expect(requestSearchPool([regular, offer], {
      isAgency: false, canViewCommercial: false, kind: 'all',
    })).toHaveLength(2);
    expect(matchesPortalQuery('שלום', 'מחט לשון שלום')).toBe(true);
    expect(matchesPortalQuery('Arava', 'ARAVA store')).toBe(true);
    expect(matchesPortalQuery(' ', 'anything')).toBe(false);
  });
});
