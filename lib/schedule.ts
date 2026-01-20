export const SCHEDULE_URL =
  process.env.NEXT_PUBLIC_SCHEDULE_URL || 'https://calendar.app.google/C9HXxJEMqBk1na2v8';

export const getScheduleUrl = () => SCHEDULE_URL;

export const openSchedulePopup = () => {
  if (typeof window !== 'undefined') {
    window.open(SCHEDULE_URL, '_blank');
  }
};

// ============================================
// GOOGLE CALENDAR EVENT LINK GENERATOR
// ============================================

export interface CalendarEventDetails {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendeeEmails?: string[];
  addConferencing?: boolean; // Adds Google Meet
}

/**
 * Generates a Google Calendar event creation link with pre-filled details.
 * When clicked, opens Google Calendar with the event ready to save.
 *
 * @param event - Event details to pre-fill
 * @returns URL string for creating the event
 */
export function generateGoogleCalendarEventLink(event: CalendarEventDetails): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';

  // Format dates to Google Calendar format (YYYYMMDDTHHmmssZ)
  const formatDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
  });

  if (event.description) {
    params.set('details', event.description);
  }

  if (event.location) {
    params.set('location', event.location);
  }

  if (event.attendeeEmails && event.attendeeEmails.length > 0) {
    params.set('add', event.attendeeEmails.join(','));
  }

  // Add Google Meet conferencing
  if (event.addConferencing) {
    params.set('crm', 'AVAILABLE');
    params.set('trp', 'true');
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates a Google Calendar event link for a consultation.
 * Pre-fills with consultation details and adds Google Meet.
 */
export function generateConsultationCalendarLink(
  title: string,
  scheduledAt: Date,
  durationMinutes: number,
  options?: {
    description?: string;
    attendeeEmails?: string[];
    clientName?: string;
    consultationType?: string;
  }
): string {
  const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  // Build a helpful description
  const descriptionParts: string[] = [];

  if (options?.consultationType) {
    descriptionParts.push(`📋 Type: ${options.consultationType}`);
  }

  if (options?.clientName) {
    descriptionParts.push(`🏢 Client: ${options.clientName}`);
  }

  if (options?.description) {
    descriptionParts.push('');
    descriptionParts.push(options.description);
  }

  descriptionParts.push('');
  descriptionParts.push('---');
  descriptionParts.push('Scheduled via CartShift Studio Portal');

  return generateGoogleCalendarEventLink({
    title: title,
    startTime: scheduledAt,
    endTime: endTime,
    description: descriptionParts.join('\n'),
    attendeeEmails: options?.attendeeEmails,
    addConferencing: true, // Always add Google Meet for consultations
  });
}

/**
 * Opens a new Google Calendar event in a popup window.
 */
export function openCalendarEventPopup(eventUrl: string): void {
  if (typeof window !== 'undefined') {
    window.open(
      eventUrl,
      'google-calendar-event',
      'width=800,height=600,menubar=no,toolbar=no,location=no,status=no'
    );
  }
}
