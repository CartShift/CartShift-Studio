/**
 * Google Calendar Integration Service
 *
 * Handles OAuth flow, token management, and Calendar API interactions.
 * Uses client-side OAuth with Firebase for token storage.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestoreDb, getFirebaseAuth } from '@/lib/firebase';
import { ConsultationType, CONSULTATION_TYPE_CONFIG } from '@/lib/types/portal';
import { Logger } from '@/lib/logger';

// Collection for storing integration credentials
const INTEGRATIONS_COLLECTION = 'agency_integrations';

/** All Google Calendar operations use the authenticated same-origin server API.
 * OAuth credentials must never be returned to, or stored by, the browser.
 */
async function googleCalendarRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();
  const response = await fetch('/api/portal/integrations/google-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...data }),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Google Calendar request failed');
  return result as T;
}


// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI =
  typeof window !== 'undefined' ? `${window.location.origin}/portal/oauth-callback` : '';

// Required scopes for Calendar API
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

// ============================================
// TYPES
// ============================================

export interface GoogleCalendarConnection {
  connected: boolean;
  email?: string;
  tokenExpiry?: Date;
  last?: Date;
  syncedCalendarIds?: string[];
  selectedCalendarId?: string; // The calendar to use for events
  error?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  meetLink?: string;
  colorId?: string;
}

export interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

// ============================================
// CONFIGURATION
// ============================================

// ============================================
// OAuth Flow
// ============================================

/**
 * Initiates Google OAuth flow by redirecting to Google's consent screen
 */
export function initiateGoogleOAuth(): void {
  if (!GOOGLE_CLIENT_ID) {
    Logger.error('Missing GOOGLE_CLIENT_ID environment variable');
    throw new Error('Google Calendar integration is not configured. Please contact support.');
  }

  const redirectUri = GOOGLE_REDIRECT_URI;
  Logger.info('Initiating Google OAuth', { redirectUri });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent to get refresh token
    state: generateStateToken(), // CSRF protection
  });

  // Store state for verification
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('google_oauth_state', params.get('state') || '');
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Generates a random state token for CSRF protection
 */
function generateStateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Handles the OAuth callback after user grants consent
 * @param code - Authorization code from Google
 * @param state - State token for CSRF verification
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  // Verify state matches
  const storedState =
    typeof window !== 'undefined' ? sessionStorage.getItem('google_oauth_state') : null;

  if (!storedState || storedState !== state) {
    return { success: false, error: 'Invalid state parameter. Please try again.' };
  }

  // Clear stored state
  sessionStorage.removeItem('google_oauth_state');

  try {
    await googleCalendarRequest<{ connected: true }>('connect', {
      code, redirectUri: GOOGLE_REDIRECT_URI,
    });
    return { success: true };
  } catch (error) {
    Logger.error('OAuth callback error', error);
    return { success: false, error: 'Failed to complete authentication' };
  }
}

// ============================================
// Public integration metadata (no secrets)
// ============================================

export async function updateCalendars(selectedCalendarId: string): Promise<void> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  await setDoc(doc(getFirestoreDb(), INTEGRATIONS_COLLECTION, `${user.uid}_google_calendar`),
    { selectedCalendarId }, { merge: true });
}

export async function getCalendarConnection(): Promise<GoogleCalendarConnection> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return { connected: false };
  try {
    const snap = await getDoc(doc(getFirestoreDb(), INTEGRATIONS_COLLECTION, `${user.uid}_google_calendar`));
    if (!snap.exists()) return { connected: false };
    const data = snap.data();
    // The server refreshes access tokens: an expired access token does not mean disconnection.
    return {
      connected: data.status === 'connected',
      email: data.email,
      tokenExpiry: data.tokenExpiry?.toDate(),
      last: data.last?.toDate(),
      syncedCalendarIds: data.syncedCalendarIds || [],
      selectedCalendarId: data.selectedCalendarId || 'primary',
    };
  } catch (error) {
    Logger.error('Error fetching connection', error);
    return { connected: false, error: 'Failed to fetch connection status' };
  }
}

export async function disconnectCalendar(): Promise<void> {
  await googleCalendarRequest<{ success: boolean }>('disconnect');
}

// ============================================
// Calendar API Operations
// ============================================

/**
 * Lists the user's calendars
 */
export async function listCalendars(): Promise<CalendarInfo[]> {
  const response = await googleCalendarRequest<{ calendars: CalendarInfo[] }>('list');
  return response.calendars || [];
}

/**
 * Creates an event on the authenticated user's selected calendar.
 */
export async function createCalendarEvent(
  event: CalendarEvent
): Promise<{ eventId: string; meetLink?: string }> {
  return googleCalendarRequest('create', {
    event: {
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
    },
  });
}

/**
 * Deletes an event on the authenticated user's selected calendar.
 */
export async function deleteCalendarEvent(eventId: string, calendarId?: string): Promise<void> {
  try {
    await googleCalendarRequest('delete', { eventId, calendarId });
  } catch (error) {
    Logger.error('Failed to delete calendar event', error);
  }
}

/** Whether the OAuth client is configured for connecting a calendar. */
export function isGoogleCalendarConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

/**
 * Checks for busy slots in the user's calendar
 */
export async function getFreeBusyIntervals(
  timeMin: Date,
  timeMax: Date
): Promise<{ start: Date; end: Date }[]> {
  try {
    const response = await googleCalendarRequest<{ busy: { start: string; end: string }[] }>(
      'freebusy', { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() }
    );
    return (response.busy || []).map(slot => ({ start: new Date(slot.start), end: new Date(slot.end) }));
  } catch (error) {
    Logger.warn('Failed to check calendar availability', { error });
    // A failed lookup is unknown availability, never an empty/available calendar.
    throw new Error('GOOGLE_CALENDAR_AVAILABILITY_UNVERIFIED');
  }
}

/** Best-effort event creation for a consultation. */
export async function tryCreateCalendarEventForConsultation(params: {
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  attendeeEmails?: string[];
  clientName?: string;
  orgId?: string;
  type?: ConsultationType;
}): Promise<{ success: boolean; meetLink?: string; eventId?: string; fallbackLink?: string }> {
  try {
    const connection = await getCalendarConnection();

    if (!connection.connected) {
      if (typeof window !== 'undefined') {
        const { generateConsultationCalendarLink } = await import('@/lib/schedule');
        const fallbackUrl = generateConsultationCalendarLink(
          params.title,
          params.scheduledAt,
          params.durationMinutes,
          { description: params.description || '' }
        );
        return { success: false, fallbackLink: fallbackUrl };
      }
      return { success: false };
    }

    const endTime = new Date(params.scheduledAt.getTime() + params.durationMinutes * 60000);

    // Build description
    const descriptionParts: string[] = [];
    if (params.clientName) {
      descriptionParts.push(`🏢 Client: ${params.clientName}`);
    }

    // Add Portal Link
    if (typeof window !== 'undefined') {
      const portalUrl = `${window.location.origin}/portal/consultations`;
      descriptionParts.push(`🔗 View in Portal: ${portalUrl}`);
    }

    if (params.description) {
      descriptionParts.push('');
      descriptionParts.push(params.description);
    }

    // Determine Color
    let colorId: string | undefined;
    if (params.type) {
      const config = CONSULTATION_TYPE_CONFIG[params.type];
      if (config?.googleCalendarColorId) {
        colorId = config.googleCalendarColorId;
      }
    }

    const eventResult = await createCalendarEvent({
      title: params.title,
      description: descriptionParts.join('\n'),
      startTime: params.scheduledAt,
      endTime,
      attendees: params.attendeeEmails,
      colorId, // Pass colorId
    });

    return {
      success: true,
      meetLink: eventResult.meetLink,
      eventId: eventResult.eventId,
    };
  } catch (error) {
    Logger.error('Failed to auto-create calendar event', error);

    // Fallback to link generation on error
    if (typeof window !== 'undefined') {
      const { generateConsultationCalendarLink } = await import('@/lib/schedule');
      const fallbackUrl = generateConsultationCalendarLink(
        params.title,
        params.scheduledAt,
        params.durationMinutes,
        { description: params.description || '' }
      );
      return { success: false, fallbackLink: fallbackUrl };
    }
    return { success: false };
  }
}
