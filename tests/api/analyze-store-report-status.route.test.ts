import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analyze-store/report-status/route';
import { getPrivateReportDeliveryStatus } from '@/lib/services/analysis-report-store';

vi.mock('@/lib/services/analysis-report-store', () => ({
  getPrivateReportDeliveryStatus: vi.fn(),
}));

const token = 'a'.repeat(32);
const request = (value: string) =>
  new NextRequest(`https://cart-shift.com/api/analyze-store/report-status?token=${value}`);

describe('private report delivery status API', () => {
  beforeEach(() => vi.resetAllMocks());

  it('rejects invalid report tokens without calling Firestore', async () => {
    const response = await GET(request('invalid'));
    expect(response.status).toBe(400);
    expect(getPrivateReportDeliveryStatus).not.toHaveBeenCalled();
  });

  it('does not disclose recipient or report details', async () => {
    vi.mocked(getPrivateReportDeliveryStatus).mockResolvedValue('sent');
    const response = await GET(request(token));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toEqual({ status: 'sent' });
  });

  it('returns not found for expired or missing reports', async () => {
    vi.mocked(getPrivateReportDeliveryStatus).mockResolvedValue(null);
    expect((await GET(request(token))).status).toBe(404);
  });

  it('reports temporary persistence failures without exposing internals', async () => {
    vi.mocked(getPrivateReportDeliveryStatus).mockRejectedValue(new Error('internal firestore error'));
    const response = await GET(request(token));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('firestore');
  });
});
