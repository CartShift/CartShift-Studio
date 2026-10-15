import 'server-only';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { validateGoogleRedirectUri } from '@/lib/services/google-calendar-redirect';

const PUBLIC_COLLECTION = 'agency_integrations';
const SECRET_COLLECTION = 'private_integration_credentials';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

function getDb() {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return adminDb;
}

function getGoogleConfiguration() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GOOGLE_NOT_CONFIGURED');
  return { clientId, clientSecret };
}

function refs(uid: string) {
  const id = `${uid}_google_calendar`;
  const db = getDb();
  return {
    publicRef: db.collection(PUBLIC_COLLECTION).doc(id),
    secretRef: db.collection(SECRET_COLLECTION).doc(id),
  };
}

type PrivateCredentials = {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Timestamp;
  selectedCalendarId?: string;
};

async function loadCredentials(uid: string): Promise<PrivateCredentials> {
  const { publicRef, secretRef } = refs(uid);
  const secret = await secretRef.get();
  if (secret.exists) return secret.data() as PrivateCredentials;

  // Transition legacy records without exposing the tokens through a new API response.
  // The migration removes the old token fields atomically with creating the private record.
  return getDb().runTransaction(async tx => {
    const current = await tx.get(secretRef);
    if (current.exists) return current.data() as PrivateCredentials;
    const legacy = await tx.get(publicRef);
    const data = legacy.data();
    if (!data?.accessToken || !data?.refreshToken) throw new Error('GOOGLE_NOT_CONNECTED');
    const migrated: PrivateCredentials = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: data.tokenExpiry || Timestamp.fromMillis(0),
    };
    tx.set(secretRef, { ...migrated, userId: uid, provider: 'google_calendar', migratedAt: FieldValue.serverTimestamp() });
    tx.update(publicRef, {
      accessToken: FieldValue.delete(),
      refreshToken: FieldValue.delete(),
    });
    return migrated;
  });
}

export async function connectGoogleCalendar(uid: string, code: string, redirectUri: string) {
  if (!validateGoogleRedirectUri(redirectUri)) throw new Error('INVALID_REDIRECT_URI');
  const { clientId, clientSecret } = getGoogleConfiguration();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');
  const tokens = await response.json() as Record<string, unknown>;
  if (typeof tokens.access_token !== 'string' || typeof tokens.refresh_token !== 'string' ||
      typeof tokens.expires_in !== 'number') {
    throw new Error('GOOGLE_TOKEN_RESPONSE_INVALID');
  }
  const { publicRef, secretRef } = refs(uid);
  const expiry = Timestamp.fromMillis(Date.now() + tokens.expires_in * 1000);
  const db = getDb();
  await db.runTransaction(async tx => {
    tx.set(secretRef, {
      userId: uid,
      provider: 'google_calendar',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: expiry,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(publicRef, {
      userId: uid,
      provider: 'google_calendar',
      status: 'connected',
      tokenExpiry: expiry,
      scope: typeof tokens.scope === 'string' ? tokens.scope : null,
      selectedCalendarId: 'primary',
      connectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      accessToken: FieldValue.delete(),
      refreshToken: FieldValue.delete(),
    }, { merge: true });
  });
  return { connected: true };
}

async function getAccess(uid: string) {
  const data = await loadCredentials(uid);
  const expiryMs = data.tokenExpiry?.toMillis?.() ?? 0;
  const { publicRef, secretRef } = refs(uid);
  const metadata = (await publicRef.get()).data() || {};
  const calendarId = typeof metadata.selectedCalendarId === 'string'
    ? metadata.selectedCalendarId : 'primary';
  if (expiryMs > Date.now() + 5 * 60_000) return { token: data.accessToken, calendarId };

  if (!data.refreshToken) throw new Error('GOOGLE_RECONNECT_REQUIRED');
  const { clientId, clientSecret } = getGoogleConfiguration();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: data.refreshToken, grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error('GOOGLE_RECONNECT_REQUIRED');
  const refreshed = await response.json() as Record<string, unknown>;
  if (typeof refreshed.access_token !== 'string' || typeof refreshed.expires_in !== 'number') {
    throw new Error('GOOGLE_RECONNECT_REQUIRED');
  }
  const nextExpiry = Timestamp.fromMillis(Date.now() + refreshed.expires_in * 1000);
  await Promise.all([
    secretRef.update({ accessToken: refreshed.access_token, tokenExpiry: nextExpiry, updatedAt: FieldValue.serverTimestamp() }),
    publicRef.update({ tokenExpiry: nextExpiry, updatedAt: FieldValue.serverTimestamp() }),
  ]);
  return { token: refreshed.access_token, calendarId };
}

async function googleRequest(uid: string, path: string, init: RequestInit) {
  const { token } = await getAccess(uid);
  const response = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('GOOGLE_API_FAILED');
  return response.status === 204 ? {} : response.json();
}

export async function listGoogleCalendars(uid: string) {
  const result = await googleRequest(uid, 'users/me/calendarList', { method: 'GET' });
  return { calendars: (result.items || []).map((item: { id: string; summary: string; primary?: boolean; backgroundColor?: string }) => ({
    id: item.id, summary: item.summary, primary: item.primary, backgroundColor: item.backgroundColor,
  })) };
}

export async function createGoogleCalendarEvent(uid: string, event: {
  title: string; description?: string; startTime: string; endTime: string;
  attendees?: string[]; location?: string; colorId?: string;
}) {
  const { calendarId } = await getAccess(uid);
  const data = await googleRequest(uid, `calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    body: JSON.stringify({
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
      attendees: event.attendees?.map(email => ({ email })),
      location: event.location,
      colorId: event.colorId,
      conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  });
  return { eventId: data.id, meetLink: data.hangoutLink };
}

export async function deleteGoogleCalendarEvent(uid: string, eventId: string, requestedCalendarId?: string) {
  const { calendarId } = await getAccess(uid);
  // Only the calendar selected by the authenticated owner can be mutated.
  if (requestedCalendarId && requestedCalendarId !== calendarId) throw new Error('INVALID_CALENDAR');
  await googleRequest(uid, `calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: 'DELETE' });
  return { success: true };
}

export async function getGoogleFreeBusy(uid: string, timeMin: string, timeMax: string) {
  const { calendarId } = await getAccess(uid);
  const data = await googleRequest(uid, 'freeBusy', {
    method: 'POST',
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });
  return { busy: data.calendars?.[calendarId]?.busy || [] };
}

export async function disconnectGoogleCalendar(uid: string) {
  const { publicRef, secretRef } = refs(uid);
  // Legacy connections must also be revoked when disconnected; migrate first.
  const token = await loadCredentials(uid).catch(() => null);
  const accessToken = token?.accessToken;
  const db = getDb();
  const batch = db.batch();
  batch.delete(publicRef);
  batch.delete(secretRef);
  await batch.commit();
  // Best effort revocation after persistent deletion: never return secrets to the browser.
  if (accessToken) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: accessToken }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch { /* Already disconnected locally; Google revocation can be retried manually. */ }
  }
  return { success: true };
}
