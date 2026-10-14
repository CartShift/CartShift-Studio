import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/utils/query-keys';

describe('pricing request query keys', () => {
  it('separates organizations and draft visibility while preserving broad invalidation prefix', () => {
    const withDrafts = queryKeys.pricing.scopedByOrg('org-a', false);
    const noDrafts = queryKeys.pricing.scopedByOrg('org-a', true);
    const otherOrg = queryKeys.pricing.scopedByOrg('org-b', false);
    expect(withDrafts).not.toEqual(noDrafts);
    expect(withDrafts).not.toEqual(otherOrg);
    expect(withDrafts.slice(0, 1)).toEqual(queryKeys.pricing.byOrg);
    expect(noDrafts.slice(0, 1)).toEqual(queryKeys.pricing.byOrg);
  });
});
