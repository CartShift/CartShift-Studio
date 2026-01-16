/**
 * Google Calendar Integration Service
 *
 * Handles OAuth flow, token management, and Calendar API interactions.
 * Uses client-side OAuth with Firebase for token storage.
 */

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getFirestoreDb, getFirebaseAuth } from '@/lib/firebase';
import { buildFirebaseFunctionUrl } from './firebase';
import { ConsultationType, CONSULTATION_TYPE_CONFIG } from '@/lib/types/portal';
import { Logger } from '@/lib/logger';

// Collection for storing integration credentials
const INTEGRATIONS_COLLECTION = 'agency_integrations';

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
  accessToken?: string;
  refreshToken?: string;
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
    alert('Google Calendar integration is not configured. Please contact support.');
    return;
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
    // Exchange code for tokens via Cloud Function (server-side for security)
    const firebaseFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
    if (!firebaseFunctionUrl) {
      return { success: false, error: 'Firebase Functions URL not configured' };
    }

    // Build the function URL - extract base and append function name
    let functionUrl = buildFirebaseFunctionUrl(firebaseFunctionUrl, 'googleCalendarOAuthCallback');

    // Fallback: if buildFirebaseFunctionUrl fails, try to construct manually
    if (!functionUrl) {
      try {
        const baseUrl = new URL(firebaseFunctionUrl);
        // Remove any existing path and construct new one
        baseUrl.pathname = '/googleCalendarOAuthCallback';
        functionUrl = baseUrl.toString();
      } catch (e) {
        Logger.error('Failed to build function URL', e);
        return { success: false, error: 'Invalid Firebase function URL' };
      }
    }

    const redirectUri = GOOGLE_REDIRECT_URI;
    Logger.debug(' Google OAuth code');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to connect Google Calendar';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
        Logger.error('OAuth callback error', error);
      } catch (_e) {
        const errorText = await response.text();
        Logger.error('OAuth callback error (non-JSON)', { errorText });
        errorMessage = errorText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const tokens = await response.json();

    // Store tokens in Firestore
    await storeGoogleTokens(tokens);

    return { success: true };
  } catch (error) {
    Logger.error('OAuth callback error', error);
    return { success: false, error: 'Failed to complete authentication' };
  }
}

// ============================================
// Token Storage
// ============================================

/**
 * Stores Google OAuth tokens in Firestore
 */
async function storeGoogleTokens(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  email?: string;
}): Promise<void> {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const integrationRef = doc(db, INTEGRATIONS_COLLECTION, `${user.uid}_google_calendar`);

  await setDoc(
    integrationRef,
    {
      userId: user.uid,
      provider: 'google_calendar',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: Timestamp.fromDate(new Date(Date.now() + tokens.expires_in * 1000)),
      scope: tokens.scope,
      email: tokens.email || null,
      status: 'connected',
      connectedAt: serverTimestamp(),
      last: null,
      syncedCalendarIds: [],
      selectedCalendarId: 'primary', // Default to primary
    },
    { merge: true }
  );
}

/**
 * Updates the selected calendar settings
 */
export async function updateCalendars(selectedCalendarId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const db = getFirestoreDb();
  const integrationRef = doc(db, INTEGRATIONS_COLLECTION, `${user.uid}_google_calendar`);
  await setDoc(integrationRef, { selectedCalendarId }, { merge: true });
}

/**
 * Gets the current Google Calendar connection status
 */
export async function getCalendarConnection(): Promise<GoogleCalendarConnection> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    return { connected: false };
  }

  const db = getFirestoreDb();

  try {
    const integrationRef = doc(db, INTEGRATIONS_COLLECTION, `${user.uid}_google_calendar`);
    const docSnap = await getDoc(integrationRef);

    if (!docSnap.exists()) {
      return { connected: false };
    }

    const data = docSnap.data();

    // Check if token is expired
    const tokenExpiry = data.tokenExpiry?.toDate();
    const isExpired = tokenExpiry && tokenExpiry < new Date();

    return {
      connected: data.status === 'connected' && !isExpired,
      email: data.email,
      tokenExpiry: tokenExpiry,
      last: data.last?.toDate(),
      syncedCalendarIds: data.syncedCalendarIds || [],
      selectedCalendarId: data.selectedCalendarId || 'primary',
      error: isExpired ? 'Token expired. Please reconnect.' : undefined,
    };
  } catch (error) {
    Logger.error('Error fetching connection', error);
    return { connected: false, error: 'Failed to fetch connection status' };
  }
}

/**
 * Disconnects Google Calendar integration
 */
export async function disconnectCalendar(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const db = getFirestoreDb();
  const integrationRef = doc(db, INTEGRATIONS_COLLECTION, `${user.uid}_google_calendar`);

  // Get current tokens to revoke
  const docSnap = await getDoc(integrationRef);
  if (docSnap.exists()) {
    const data = docSnap.data();

    // Revoke token with Google (best effort)
    if (data.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${data.accessToken}`, {
          method: 'POST',
        });
      } catch (error) {
        Logger.warn('Token revocation failed', { error });
      }
    }
  }

  // Delete from Firestore
  await deleteDoc(integrationRef);
}

// ============================================
// Calendar API Operations
// ============================================

/**
 * Lists the user's calendars
 */
export async function listCalendars(): Promise<CalendarInfo[]> {
  const connection = await getCalendarConnection();

  if (!connection.connected) {
    throw new Error('Google Calendar not connected');
  }

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();

    const firebaseFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
    if (!firebaseFunctionUrl) throw new Error('Firebase Functions URL not configured');

    const url = buildFirebaseFunctionUrl(firebaseFunctionUrl, 'googleCalendarListCalendars');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to list calendars');
    }

    const data = await response.json();
    return data.calendars || [];
  } catch (error) {
    Logger.error('Error listing calendars', error);
    throw error;
  }
}

/**
 * Creates a calendar event
 */
export async function createCalendarEvent(
  event: CalendarEvent
): Promise<{ eventId: string; meetLink?: string }> {
  const connection = await getCalendarConnection();

  if (!connection.connected) {
    throw new Error('Google Calendar not connected');
  }

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();

    const firebaseFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
    if (!firebaseFunctionUrl) throw new Error('Firebase Functions URL not configured');

    const url = buildFirebaseFunctionUrl(firebaseFunctionUrl, 'googleCalendarCreateEvent');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create calendar event');
    }

    return await response.json();
  } catch (error) {
    Logger.error('Error creating calendar event', error);
    throw error;
  }
}

/**
 * Deletes a calendar event
 */
export async function deleteCalendarEvent(eventId: string, calendarId?: string): Promise<void> {
  const connection = await getCalendarConnection();
  if (!connection.connected) return;

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();

    const firebaseFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
    if (!firebaseFunctionUrl) throw new Error('Firebase Functions URL not configured');

    const url = buildFirebaseFunctionUrl(firebaseFunctionUrl, 'googleCalendarDeleteEvent');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId, calendarId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }
  } catch (error) {
    Logger.error('Error deleting calendar event', error);
    // Don't throw, just log. Deletion failure shouldn't block the UI flow entirely.
  }
}

/**
 * Checks if the integration is properly configured
 */
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
  const connection = await getCalendarConnection();

  if (!connection.connected) {
    return [];
  }

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();

    const firebaseFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
    if (!firebaseFunctionUrl) throw new Error('Firebase Functions URL not configured');

    const url = buildFirebaseFunctionUrl(firebaseFunctionUrl, 'googleCalendarGetFreeBusy');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      }),
    });

    if (!response.ok) {
      // If we fail to check availability, just return empty to avoid blocking
      Logger.warn('Failed to check availability');
      return [];
    }

    const data = await response.json();
    const busySlots = data.busy || [];

    return busySlots.map((slot: any) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }));
  } catch (error) {
    Logger.error('Error checking free/busy', error);
    return [];
  }
}

/**
 * Tries to create a calendar event for a consultation.
 * Returns the event details if successful, or null if not connected.
 * This is a "best effort" function - it won't throw errors if calendar is not connected.
 */
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
