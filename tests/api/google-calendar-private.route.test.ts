import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  profile: vi.fn(),
  connect: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  freebusy: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: mocks.session }));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: { collection: () => ({ doc: () => ({ get: mocks.profile }) }) },
}));
vi.mock('@/lib/services/google-calendar-server', () => ({
  connectGoogleCalendar: mocks.connect,
  listGoogleCalendars: mocks.list,
  createGoogleCalendarEvent: mocks.create,
  deleteGoogleCalendarEvent: mocks.remove,
  getGoogleFreeBusy: mocks.freebusy,
  disconnectGoogleCalendar: mocks.disconnect,
}));

import { POST } from '@/app/api/portal/integrations/google-calendar/route';

const req = (body: unknown, origin?: string) => new NextRequest(
  'https://portal.cart-shift.com/api/portal/integrations/google-calendar',
  { method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  }
);

describe('Google Calendar private API boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ uid: 'owner-a', emailVerified: true });
    mocks.profile.mockResolvedValue({
      data: () => ({ accountType: 'AGENCY', agencyRole: 'owner', status: 'active' }),
    });
    mocks.list.mockResolvedValue({ calendars: [] });
    mocks.connect.mockResolvedValue({ connected: true });
    mocks.disconnect.mockResolvedValue({ success: true });
  });

  it('rejects cross-origin requests even with a valid session', async () => {
    expect((await POST(req({ action: 'list' }, 'https://evil.example'))).status).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('requires authentication before reading user data', async () => {
    mocks.session.mockResolvedValue(null);
    expect((await POST(req({ action: 'list' }))).status).toBe(401);
    expect(mocks.profile).not.toHaveBeenCalled();
  });

  it('rejects users outside the agency and suspended users', async () => {
    mocks.profile.mockResolvedValueOnce({ data: () => ({ accountType: 'CLIENT', status: 'active' }) });
    expect((await POST(req({ action: 'list' }))).status).toBe(403);
    mocks.profile.mockResolvedValueOnce({ data: () => ({ isAgency: true, status: 'suspended' }) });
    expect((await POST(req({ action: 'list' }))).status).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('scopes all Google operations to the verified session UID, never a supplied UID', async () => {
    const result = await POST(req({ action: 'connect', code: 'valid-auth-code', redirectUri: 'https://cart-shift.com/portal/oauth-callback', uid: 'victim-b' }));
    expect(result.status).toBe(200);
    expect(mocks.connect).toHaveBeenCalledWith('owner-a', 'valid-auth-code', 'https://cart-shift.com/portal/oauth-callback');
    expect(JSON.stringify(await result.json())).not.toMatch(/access_token|refresh_token/);
  });

  it('validates event dates without touching calendar credentials', async () => {
    expect((await POST(req({ action: 'create', event: {
      title: 'Invalid event', startTime: '2026-10-20T15:00:00.000Z', endTime: '2026-10-20T14:00:00.000Z',
    } }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('does not reveal tokens or permit forged action payloads', async () => {
    const response = await POST(req({ action: 'list', userId: 'victim-b' }));
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith('owner-a');
    expect((await POST(req({ action: 'dropCollection' }))).status).toBe(400);
  });
});
