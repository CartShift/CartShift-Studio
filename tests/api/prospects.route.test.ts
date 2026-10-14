import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(), list: vi.fn(), upsert: vi.fn(),
}));

vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: mocks.session }));
vi.mock('@/lib/services/prospects-server', () => ({
  listProspects: mocks.list, upsertProspect: mocks.upsert,
}));

import { GET, POST } from '@/app/api/portal/agency/prospects/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ uid: 'agency-user' });
  mocks.list.mockResolvedValue({ prospects: [], truncated: false });
  mocks.upsert.mockResolvedValue({ prospect_id: 'prospect_123', created: true });
});

describe('private prospect portal endpoints', () => {
  it('denies unauthenticated callers before storage', async () => {
    mocks.session.mockResolvedValueOnce(null);
    const response = await GET(new NextRequest('https://portal.cart-shift.com/api/portal/agency/prospects'));
    expect(response.status).toBe(401);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('returns a forbidden response for nonagency users', async () => {
    mocks.list.mockRejectedValueOnce(new Error('FORBIDDEN'));
    const response = await GET(new NextRequest('https://portal.cart-shift.com/api/portal/agency/prospects'));
    expect(response.status).toBe(403);
  });

  it('discards user-supplied consent fields on manual import', async () => {
    const response = await POST(new NextRequest('https://portal.cart-shift.com/api/portal/agency/prospects', {
      method: 'POST',
      body: JSON.stringify({
        store_url: 'https://shop.co.il',
        source_url: 'https://shop.co.il/about',
        outreachEligibility: 'consent_recorded',
        marketingConsent: true,
      }),
    }));
    expect(response.status).toBe(200);
    const passed = mocks.upsert.mock.calls[0][0];
    expect(passed).toEqual({
      store_url: 'https://shop.co.il',
      source_url: 'https://shop.co.il/about',
      brand_name: undefined, research_note: undefined, source_type: 'manual',
    });
    expect(passed).not.toHaveProperty('outreachEligibility');
    expect(passed).not.toHaveProperty('marketingConsent');
  });
});