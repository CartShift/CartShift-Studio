import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/utils/query-keys';

describe('role-specific request caches', () => {
  it('retains agency mutation prefixes while isolating client-safe projections', () => {
    expect(queryKeys.requests.byRoleOrg('org-a', 'agency')).toEqual(queryKeys.requests.byOrg('org-a'));
    expect(queryKeys.requests.byRoleOrg('org-a', 'client')).not.toEqual(queryKeys.requests.byOrg('org-a'));
    expect(queryKeys.requests.byRoleOrg('org-a', 'client').slice(0, 2))
      .toEqual(queryKeys.requests.byOrg('org-a'));
    expect(queryKeys.requests.byRoleDetail('request-a', 'client')).not.toEqual(queryKeys.requests.detail('request-a'));
    expect(queryKeys.requests.byRoleDetail('request-a', 'client').slice(0, 2))
      .toEqual(queryKeys.requests.detail('request-a'));
    expect(queryKeys.requests.commentsByRole('request-a', 'org-a', 'client'))
      .not.toEqual(queryKeys.requests.comments('request-a', 'org-a'));
  });
});
