import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/identity';
import * as calendar from './calendar';
import * as email from './email';

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

      // Check if error is from Google OAuth (invalid/expired token)
      const errorMessage = (error as { message?: string })?.message || '';
      const errorCode = (error as { code?: string | number })?.code;

      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired or revoked') ||
        errorCode === 401
      ) {
        // Remove invalid tokens so user can re-authorize
        await calendar.removeUserTokens(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
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
      return { event: newEvent };
    } catch (error: unknown) {
      console.error('Error creating calendar event:', error);

      // Check if error is from Google OAuth (invalid/expired token)
      const errorMessage = (error as { message?: string })?.message || '';
      const errorCode = (error as { code?: string | number })?.code;

      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired or revoked') ||
        errorCode === 401
      ) {
        // Remove invalid tokens so user can re-authorize
        await calendar.removeUserTokens(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
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
      return { event: updatedEvent };
    } catch (error: unknown) {
      console.error('Error updating calendar event:', error);

      // Check if error is from Google OAuth (invalid/expired token)
      const errorMessage = (error as { message?: string })?.message || '';
      const errorCode = (error as { code?: string | number })?.code;

      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired or revoked') ||
        errorCode === 401
      ) {
        // Remove invalid tokens so user can re-authorize
        await calendar.removeUserTokens(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
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

      // Check if error is from Google OAuth (invalid/expired token)
      const errorMessage = (error as { message?: string })?.message || '';
      const errorCode = (error as { code?: string | number })?.code;

      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired or revoked') ||
        errorCode === 401
      ) {
        // Remove invalid tokens so user can re-authorize
        await calendar.removeUserTokens(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
        );
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

      // Check if error is from Google OAuth (invalid/expired token)
      const errorMessage = (error as { message?: string })?.message || '';
      const errorCode = (error as { code?: string | number })?.code;

      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired or revoked') ||
        errorCode === 401
      ) {
        // Remove invalid tokens so user can re-authorize
        await calendar.removeUserTokens(userId);
        throw new HttpsError(
          'unauthenticated',
          'Calendar authorization has expired. Please re-authorize calendar access.',
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
