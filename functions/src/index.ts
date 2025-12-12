import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/identity';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as calendar from './calendar';
import { CalendarErrorType } from './calendar';
import * as email from './email';

// Background calendar sync settings (cost-aware)
const SYNC_LOOKAHEAD_DAYS = 30; // how far ahead we sync
const SYNC_LOOKBACK_DAYS = 7; // sync a limited window of past events
const SYNC_MAX_APPOINTMENTS = 150; // per run per user to cap API usage

interface AppointmentDoc {
  id: string;
  startTime?: FirebaseFirestore.Timestamp | string;
  endTime?: FirebaseFirestore.Timestamp | string;
  client?: { name?: string };
  dog?: { name?: string; breed?: { name?: string }; isAggressive?: boolean };
  services?: { name: string }[];
  packages?: { name: string }[];
  notes?: string;
  completed?: boolean;
  deletedAt?: FirebaseFirestore.Timestamp | null;
  googleCalendarEventId?: string;
  lastModified?: FirebaseFirestore.Timestamp | string;
}

function toDate(value?: FirebaseFirestore.Timestamp | string): Date | null {
  if (!value) return null;
  if (typeof value === 'string') return new Date(value);
  if (typeof (value as FirebaseFirestore.Timestamp).toDate === 'function') {
    return (value as FirebaseFirestore.Timestamp).toDate();
  }
  return null;
}

async function syncUserAgenda(
  userId: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<void> {
  const firestore = admin.firestore();

  // Fetch upcoming appointments within the window
  const appointmentsSnap = await firestore
    .collection('appointments')
    .where('startTime', '>=', timeMin)
    .where('startTime', '<=', timeMax)
    .orderBy('startTime', 'asc')
    .limit(SYNC_MAX_APPOINTMENTS)
    .get();

  const appointments: AppointmentDoc[] = appointmentsSnap.docs
    .map((doc) => ({ ...(doc.data() as AppointmentDoc), id: doc.id }))
    // Filter out soft-deleted records client-side to avoid extra indexes
    .filter((a) => !a.deletedAt);

  console.log(
    `Found ${appointments.length} active appointments for user ${userId}`,
  );

  // Fetch existing Google events in the same window (only once per user)
  const googleEvents =
    (await calendar.getCalendarEvents(userId, calendarId, {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    })) || [];

  const googleEventsMap = new Map(
    googleEvents
      .filter(
        (e) =>
          e.id && e.extendedProperties?.private?.['source'] === 'trimsalon-app',
      )
      .map((e) => [e.id as string, e]),
  );

  const processedGoogleIds = new Set<string>();

  for (const appointment of appointments) {
    const start = toDate(appointment.startTime);
    const end =
      toDate(appointment.endTime) ||
      (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);

    if (!start || !end) {
      console.warn(
        `Skipping appointment ${appointment.id} due to missing start/end time`,
      );
      continue;
    }

    const eventPayload = calendar.appointmentToCalendarEvent(
      {
        ...appointment,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        deletedAt: toDate(appointment.deletedAt || undefined) || undefined,
      },
      false,
    );

    if (appointment.googleCalendarEventId) {
      try {
        await calendar.updateCalendarEvent(
          userId,
          calendarId,
          appointment.googleCalendarEventId,
          eventPayload,
        );
        processedGoogleIds.add(appointment.googleCalendarEventId);
      } catch (error) {
        const errorType = calendar.categorizeCalendarError(error);

        if (errorType === CalendarErrorType.NOT_FOUND) {
          // Event missing in Google, recreate
          const created = await calendar.createCalendarEvent(
            userId,
            calendarId,
            eventPayload,
          );
          if (created?.id) {
            await firestore.collection('appointments').doc(appointment.id).set(
              {
                googleCalendarEventId: created.id,
                lastModified: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            processedGoogleIds.add(created.id);
          }
        } else {
          throw error;
        }
      }
    } else {
      const created = await calendar.createCalendarEvent(
        userId,
        calendarId,
        eventPayload,
      );

      if (created?.id) {
        await firestore.collection('appointments').doc(appointment.id).set(
          {
            googleCalendarEventId: created.id,
            lastModified: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        processedGoogleIds.add(created.id);
      }
    }
  }

  // Clean up Google events that belong to the app but no longer exist locally
  const localGoogleIds = new Set(
    appointments
      .map((a) => a.googleCalendarEventId)
      .filter((id): id is string => !!id),
  );

  for (const [googleEventId] of googleEventsMap) {
    if (!localGoogleIds.has(googleEventId)) {
      console.log(`Deleting orphaned Google event: ${googleEventId}`);
      await calendar.deleteCalendarEvent(userId, calendarId, googleEventId);
    }
  }
}

admin.initializeApp();

// Auth blocking function temporarily disabled - requires special Firebase configuration
// See: https://firebase.google.com/docs/auth/extend-with-blocking-functions
/*
import {
  AuthBlockingEvent,
  beforeUserCreated,
} from 'firebase-functions/v2/identity';

export const beforeusercreate = beforeUserCreated(
  {
    region: 'europe-west1',
  },
  async (event: AuthBlockingEvent) => {
    const user = event.data;
    const email = user?.email;

    if (!email) {
      throw new HttpsError('invalid-argument', 'Email is required.');
    }

    const firestore = admin.firestore();
    const allowedUsersCollection = firestore.collection('allowed-users');

    try {
      const snapshot = await allowedUsersCollection
        .where('email', '==', email.toLowerCase())
        .get();

      if (snapshot.empty) {
        console.log(
          `User ${email} is not in the allowed list. Blocking creation.`,
        );
        throw new HttpsError(
          'permission-denied',
          'This email address is not authorized to create a user.',
        );
      }
    } catch (error) {
      console.error('Error checking for allowed user:', error);
      throw new HttpsError(
        'internal',
        'An error occurred while validating the user.',
      );
    }

    console.log(`User ${email} is allowed.`);
  },
);
*/

// Calendar functions
export const exchangeAuthCode = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { code, userId } = request.data;

    if (!code || !userId) {
      console.error('exchangeAuthCode: Missing code or userId');
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with arguments "code" and "userId".',
      );
    }

    try {
      console.log(`Attempting to exchange code for tokens for user ${userId}`);
      const tokens = await calendar.exchangeCodeForTokens(code);
      console.log(`Tokens exchanged for user ${userId}. Saving tokens...`);
      await calendar.saveUserTokens(userId, tokens);
      console.log(`Tokens saved for user ${userId}.`);
      return { success: true };
    } catch (error) {
      console.error('Error exchanging auth code or saving tokens:', error);
      throw new HttpsError(
        'internal',
        'Failed to process calendar authorization.',
      );
    }
  },
);

export const getCalendarEvents = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId, calendarId, timeMin, timeMax } = request.data;

    if (!userId || !calendarId) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with the arguments "userId" and "calendarId".',
      );
    }

    try {
      const events = await calendar.getCalendarEvents(userId, calendarId, {
        timeMin,
        timeMax,
      });
      return { events: events || [] };
    } catch (error: unknown) {
      console.error('Error getting calendar events:', error);

      const errorType = calendar.categorizeCalendarError(error);

      if (errorType === CalendarErrorType.AUTH_EXPIRED) {
        // Remove invalid tokens and mark for re-auth
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
      }

      if (errorType === CalendarErrorType.RATE_LIMITED) {
        throw new HttpsError(
          'resource-exhausted',
          'Google Calendar rate limit exceeded. Please try again later.',
        );
      }

      throw new HttpsError('internal', 'Failed to retrieve calendar events.');
    }
  },
);

export const hasCalendarAccess = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with the argument "userId".',
      );
    }

    try {
      const hasAccess = await calendar.hasCalendarAccess(userId);
      return { hasAccess };
    } catch (error) {
      console.error('Error checking for calendar access:', error);
      throw new HttpsError('internal', 'Failed to check for calendar access.');
    }
  },
);

export const createCalendarEvent = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId, calendarId, event } = request.data;

    if (!userId || !calendarId || !event) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with arguments "userId", "calendarId", and "event".',
      );
    }

    try {
      // Transform the appointment to Google Calendar event format
      const calendarEvent = calendar.appointmentToCalendarEvent(event);
      const newEvent = await calendar.createCalendarEvent(
        userId,
        calendarId,
        calendarEvent,
      );
      // Clear any previous sync errors on success
      await calendar.clearSyncStatus(userId);
      return { event: newEvent };
    } catch (error: unknown) {
      console.error('Error creating calendar event:', error);

      const errorType = calendar.categorizeCalendarError(error);

      if (errorType === CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
      }

      if (errorType === CalendarErrorType.RATE_LIMITED) {
        throw new HttpsError(
          'resource-exhausted',
          'Google Calendar rate limit exceeded. Please try again later.',
        );
      }

      throw new HttpsError('internal', 'Failed to create calendar event.');
    }
  },
);

export const updateCalendarEvent = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId, calendarId, eventId, event } = request.data;

    if (!userId || !calendarId || !eventId || !event) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with arguments "userId", "calendarId", "eventId", and "event".',
      );
    }

    try {
      // Transform the appointment to Google Calendar event format (with ID for updates)
      const calendarEvent = calendar.appointmentToCalendarEvent(event, true);
      const updatedEvent = await calendar.updateCalendarEvent(
        userId,
        calendarId,
        eventId,
        calendarEvent,
      );
      // Clear any previous sync errors on success
      await calendar.clearSyncStatus(userId);
      return { event: updatedEvent };
    } catch (error: unknown) {
      console.error('Error updating calendar event:', error);

      const errorType = calendar.categorizeCalendarError(error);

      if (errorType === CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
      }

      if (errorType === CalendarErrorType.RATE_LIMITED) {
        throw new HttpsError(
          'resource-exhausted',
          'Google Calendar rate limit exceeded. Please try again later.',
        );
      }

      if (errorType === CalendarErrorType.NOT_FOUND) {
        // Event doesn't exist in Google, might have been deleted manually
        console.warn(`Calendar event ${eventId} not found, skipping update.`);
        return { event: null, warning: 'Event not found in calendar' };
      }

      throw new HttpsError('internal', 'Failed to update calendar event.');
    }
  },
);

export const deleteCalendarEvent = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId, calendarId, eventId } = request.data;

    if (!userId || !calendarId || !eventId) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with arguments "userId", "calendarId", and "eventId".',
      );
    }

    try {
      await calendar.deleteCalendarEvent(userId, calendarId, eventId);
      return { success: true };
    } catch (error: unknown) {
      console.error('Error deleting calendar event:', error);

      const errorType = calendar.categorizeCalendarError(error);

      if (errorType === CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
      }

      if (errorType === CalendarErrorType.RATE_LIMITED) {
        throw new HttpsError(
          'resource-exhausted',
          'Google Calendar rate limit exceeded. Please try again later.',
        );
      }

      if (errorType === CalendarErrorType.NOT_FOUND) {
        // Event already deleted, that's fine
        console.warn(`Calendar event ${eventId} not found, already deleted.`);
        return { success: true, warning: 'Event was already deleted' };
      }

      throw new HttpsError('internal', 'Failed to delete calendar event.');
    }
  },
);

export const listCalendars = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with the argument "userId".',
      );
    }

    try {
      const calendarClient = await calendar.getCalendarClient(userId);
      if (!calendarClient) {
        throw new HttpsError('unauthenticated', 'User is not authenticated.');
      }
      const calendars = await calendarClient.calendarList.list();
      return { items: calendars.data.items };
    } catch (error: unknown) {
      console.error('Error listing calendars:', error);

      const errorType = calendar.categorizeCalendarError(error);

      if (errorType === CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
      }

      if (errorType === CalendarErrorType.RATE_LIMITED) {
        throw new HttpsError(
          'resource-exhausted',
          'Google Calendar rate limit exceeded. Please try again later.',
        );
      }

      throw new HttpsError('internal', 'Failed to list calendars.');
    }
  },
);
export const createCalendar = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { userId, summary } = request.data;

    if (!userId || !summary) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with arguments "userId" and "summary".',
      );
    }

    try {
      const calendarClient = await calendar.getCalendarClient(userId);
      if (!calendarClient) {
        throw new HttpsError('unauthenticated', 'User is not authenticated.');
      }
      const newCalendar = await calendarClient.calendars.insert({
        requestBody: {
          summary,
        },
      });
      return newCalendar.data;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw new HttpsError('internal', 'Failed to create calendar.');
    }
  },
);

// Manual trigger for calendar sync
export const triggerCalendarSync = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    const userId = request.auth.uid;

    const now = new Date();
    const timeMin = new Date(
      now.getTime() - SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );
    const timeMax = new Date(
      now.getTime() + SYNC_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
    );

    try {
      const hasAccess = await calendar.hasCalendarAccess(userId);
      if (!hasAccess) {
        throw new HttpsError(
          'failed-precondition',
          'No calendar access. Please link your account first.',
        );
      }

      const calendarId = await calendar.ensureTrimSalonCalendar(userId);
      if (!calendarId) {
        throw new HttpsError(
          'internal',
          'TrimSalon calendar unavailable. Please try again.',
        );
      }

      await syncUserAgenda(userId, calendarId, timeMin, timeMax);
      return { success: true };
    } catch (error) {
      console.error('Manual sync failed:', error);
      // Re-throw HttpsErrors, wrap others
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Sync failed.');
    }
  },
);

// Scheduled background sync (cost-aware, limited scope)
export const scheduledCalendarSync = onSchedule(
  {
    region: 'europe-west1',
    schedule: 'every 2 hours',
    timeZone: 'Europe/Amsterdam',
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const firestore = admin.firestore();
    const allowedUsersSnap = await firestore.collection('allowed-users').get();

    if (allowedUsersSnap.empty) {
      console.log('No allowed users configured, skipping background sync.');
      return;
    }

    const now = new Date();
    const timeMin = new Date(
      now.getTime() - SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );
    const timeMax = new Date(
      now.getTime() + SYNC_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000,
    );

    for (const doc of allowedUsersSnap.docs) {
      const email = doc.id || (doc.data() as { email?: string }).email;
      if (!email) {
        continue;
      }

      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const userId = userRecord.uid;

        const hasAccess = await calendar.hasCalendarAccess(userId);
        if (!hasAccess) {
          console.log(`Skipping ${email}: no calendar tokens stored.`);
          continue;
        }

        const calendarId = await calendar.ensureTrimSalonCalendar(userId);
        if (!calendarId) {
          console.warn(`Skipping ${email}: TrimSalon calendar unavailable.`);
          continue;
        }

        await syncUserAgenda(userId, calendarId, timeMin, timeMax);
      } catch (error) {
        console.error(`Background sync failed for ${email}:`, error);
      }
    }
  },
);

// Email functions
export const sendAppointmentReminderEmail = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { to, appointment } = request.data;

    if (!to || !appointment) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with arguments "to" and "appointment".',
      );
    }

    try {
      await email.sendAppointmentReminder(to, appointment);
      return { success: true };
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      throw new HttpsError(
        'internal',
        'Failed to send appointment reminder email.',
      );
    }
  },
);
