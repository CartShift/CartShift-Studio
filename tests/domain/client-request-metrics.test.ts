import { describe, expect, it } from 'vitest';
import { summarizeClientRequests } from '@/lib/domain/client-request-metrics';

describe('client request metrics', () => {
  it('counts active and completed requests without including canceled work', () => {
    expect(summarizeClientRequests([
      { status: 'NEW' },
      { status: 'IN_PROGRESS' },
      { status: 'PAID' },
      { status: 'CANCELED' },
    ])).toEqual({ activeRequests: 2, completedRequests: 1, avgResolution: 0 });
  });

  it('averages only completed requests with usable dates, including serialized timestamps', () => {
    const summary = summarizeClientRequests([
      { status: 'DELIVERED', createdAt: new Date('2026-01-01'), deliveredAt: new Date('2026-01-03') },
      { status: 'CLOSED', createdAt: { seconds: 1767225600 }, closedAt: { seconds: 1767657600 } },
      { status: 'PAID', createdAt: 'invalid', closedAt: new Date('2026-01-08') },
      { status: 'CLOSED', createdAt: new Date('2026-02-05'), closedAt: new Date('2026-02-01') },
    ]);
    expect(summary.completedRequests).toBe(4);
    expect(summary.avgResolution).toBe(4); // (2 + 5)/2 rounded
  });
});
