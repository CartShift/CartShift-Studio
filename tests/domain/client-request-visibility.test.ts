import { describe, expect, it } from 'vitest';
import { sanitizeClientRequest } from '@/lib/domain/client-request-visibility';

describe('client request projection', () => {
  it('does not expose a draft or unsent quote even to an org member', () => {
    expect(sanitizeClientRequest('q1', {
      orgId: 'org1', isBillable: true, status: 'DRAFT',
      publicAccessEnabled: true, agencyNotes: 'secret', publicToken: 'private-token',
    })).toBeNull();
  });
  it('shows only the published terms and keeps private fields inaccessible', () => {
    const result = sanitizeClientRequest('q1', {
      orgId: 'org1', isBillable: true, publicAccessEnabled: true,
      status: 'QUOTED', description: 'new unsent edit', totalAmount: 1000,
      agencyNotes: 'confidential', publicToken: 'secret',
      paymentIds: ['private'], signatureText: 'client',
      publishedProposal: { description: 'sent terms', totalAmount: 2000 },
    });
    expect(result).toMatchObject({ id: 'q1', description: 'sent terms', totalAmount: 2000 });
    expect(result).not.toHaveProperty('agencyNotes');
    expect(result).not.toHaveProperty('publicToken');
    expect(result).not.toHaveProperty('paymentIds');
    expect(result).not.toHaveProperty('signatureText');
    expect(result).not.toHaveProperty('publishedProposal');
  });
  it('keeps public execution work linked to the project', () => {
    expect(sanitizeClientRequest('task1', {
      orgId: 'org1', projectId: 'project1', requestRole: 'bundle_item', status: 'QUEUED',
    })).toMatchObject({ id: 'task1', projectId: 'project1', status: 'QUEUED' });
  });
  it('does not reveal unpublished change proposals', () => {
    expect(sanitizeClientRequest('change1', {
      orgId: 'org1', isBillable: true, status: 'QUOTED', publicAccessEnabled: false,
    })).toBeNull();
  });
});
