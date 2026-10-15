import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  connectGoogleCalendar, listGoogleCalendars, createGoogleCalendarEvent,
  deleteGoogleCalendarEvent, getGoogleFreeBusy, disconnectGoogleCalendar,
} from '@/lib/services/google-calendar-server';

export const runtime = 'nodejs';

const isoDate = z.string().datetime({ offset: true });
const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('connect'), code: z.string().min(8).max(4096), redirectUri: z.string().url().max(512) }),
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('create'), event: z.object({
    title: z.string().min(1).max(300), description: z.string().max(10000).optional(),
    startTime: isoDate, endTime: isoDate,
    attendees: z.array(z.string().email()).max(30).optional(),
    location: z.string().max(500).optional(),
    colorId: z.string().max(4).optional(),
  }) }),
  z.object({ action: z.literal('delete'), eventId: z.string().min(1).max(512), calendarId: z.string().max(512).optional() }),
  z.object({ action: z.literal('freebusy'), timeMin: isoDate, timeMax: isoDate }),
  z.object({ action: z.literal('disconnect') }),
]);

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
  }
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await adminAuth.verifyIdToken(bearer, true).catch(() => null);
  if (!session?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Google credentials are always scoped to the authenticated owner.
  const actor = await adminDb.collection('portal_users').doc(session.uid).get();
  const profile = actor.data();
  if (!profile || (profile.isAgency !== true && profile.accountType !== 'AGENCY') ||
      ['suspended', 'inactive'].includes(profile.status)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const parsed = command.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  try {
    const input = parsed.data;
    let data: unknown;
    switch (input.action) {
      case 'connect': data = await connectGoogleCalendar(session.uid, input.code, input.redirectUri); break;
      case 'list': data = await listGoogleCalendars(session.uid); break;
      case 'create':
        if (Date.parse(input.event.startTime) >= Date.parse(input.event.endTime)) {
          return NextResponse.json({ error: 'Invalid event duration' }, { status: 400 });
        }
        data = await createGoogleCalendarEvent(session.uid, input.event);
        break;
      case 'delete': data = await deleteGoogleCalendarEvent(session.uid, input.eventId, input.calendarId); break;
      case 'freebusy':
        if (Date.parse(input.timeMin) >= Date.parse(input.timeMax)) {
          return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
        }
        data = await getGoogleFreeBusy(session.uid, input.timeMin, input.timeMax);
        break;
      case 'disconnect': data = await disconnectGoogleCalendar(session.uid); break;
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    if (reason === 'INVALID_REDIRECT_URI' || reason === 'INVALID_CALENDAR') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (reason === 'GOOGLE_NOT_CONNECTED' || reason === 'GOOGLE_RECONNECT_REQUIRED') {
      return NextResponse.json({ error: 'Google Calendar needs reconnection' }, { status: 409 });
    }
    if (reason === 'GOOGLE_NOT_CONFIGURED' || reason === 'ADMIN_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Integration unavailable' }, { status: 503 });
    }
    console.error('[GoogleCalendar] API action failed', { action: parsed.data.action, reason });
    return NextResponse.json({ error: 'Google Calendar request failed' }, { status: 502 });
  }
}
