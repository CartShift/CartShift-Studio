import { describe, expect, it, vi } from 'vitest';
import { getPrivateReportDeliveryStatus } from '@/lib/services/analysis-report-store';

const { getReport } = vi.hoisted(() => ({ getReport: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: { collection: () => ({ doc: () => ({ get: getReport }) }) },
}));

describe('private report delivery status', () => {
  it('reports exhausted worker retries as failed delivery', async () => {
    getReport.mockResolvedValue({
      exists: true,
      data: () => ({
        expiresAt: { toDate: () => new Date(Date.now() + 60_000) },
        delivery: { status: 'exhausted' },
      }),
    });

    expect(await getPrivateReportDeliveryStatus('a'.repeat(32))).toBe('failed');
  });
});
