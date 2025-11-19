import * as admin from 'firebase-admin';
import { defineString } from 'firebase-functions/params';
import { Credentials } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

// Use Firebase's secret management for client ID and secret
const googleClientId = defineString('GOOGLE_CLIENT_ID');
const googleClientSecret = defineString('GOOGLE_CLIENT_SECRET');

/**
 * Transform an Appointment object to a Google Calendar Event schema.
 * @param {any} appointment The appointment object from Firestore.
 * @param {boolean} includeId Whether to include the id field (for updates, not for creates).
 * @return {calendar_v3.Schema$Event} The transformed Google Calendar event.
 */
export function appointmentToCalendarEvent(
  appointment: any,
  includeId = false,
): calendar_v3.Schema$Event {
  const dogName = appointment.dog?.name || 'Unknown Dog';
  const clientName = appointment.client?.name || 'Unknown Client';
  const services =
    appointment.services?.map((s: any) => s.name).join(', ') || 'No services';
  const packages =
    appointment.packages?.map((p: any) => p.name).join(', ') || '';

  const summary = `${dogName} (${clientName})`;
  const description = `
Services: ${services}
${packages ? `Packages: ${packages}` : ''}
${appointment.notes ? `Notes: ${appointment.notes}` : ''}
`.trim();

  const event: calendar_v3.Schema$Event = {
    summary,
    description,
    start: {
      dateTime: appointment.startTime,
      timeZone: 'Europe/Amsterdam',
    },
    end: {
      dateTime: appointment.endTime,
      timeZone: 'Europe/Amsterdam',
    },
    colorId: '9', // Sage/Salie color in Google Calendar
  };

  // Only include ID for updates, not for new events
  if (includeId && appointment.id) {
    event.id = appointment.id;
  }

  return event;
}

/**
 * Exchange an authorization code for OAuth 2.0 tokens.
 * @param {string} code The authorization code from the client.
 * @return {Promise<Credentials>} A promise that resolves with the tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<Credentials> {
  const oAuth2Client = new google.auth.OAuth2(
    googleClientId.value(),
    googleClientSecret.value(),
    'postmessage', // This must match the client-side redirect_uri
  );

  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

/**
 * Save the user's tokens to Firestore.
 * @param {string} userId The user's ID.
 * @param {Credentials} tokens The tokens to save.
 * @return {Promise<void>} A promise that resolves when the tokens are saved.
 */
export async function saveUserTokens(
  userId: string,
  tokens: Credentials,
): Promise<void> {
  const firestore = admin.firestore();
  const userRef = firestore.collection('users').doc(userId);
  await userRef.set({ tokens }, { merge: true });
}

/**
 * Remove the user's tokens from Firestore (for expired/invalid tokens).
 * @param {string} userId The user's ID.
 * @return {Promise<void>} A promise that resolves when the tokens are removed.
 */
export async function removeUserTokens(userId: string): Promise<void> {
  const firestore = admin.firestore();
  const userRef = firestore.collection('users').doc(userId);
  await userRef.set(
    { tokens: admin.firestore.FieldValue.delete() },
    { merge: true },
  );
  console.log(`Tokens removed for user ${userId}`);
}

/**
 * Load the user's tokens from Firestore.
 * @param {string} userId The user's ID.
 * @return {Promise<Credentials | null>} A promise that resolves with the tokens or null.
 */
export async function loadTokensFromFirestore(
  userId: string,
): Promise<Credentials | null> {
  const firestore = admin.firestore();
  const userRef = firestore.collection('users').doc(userId);
  const doc = await userRef.get();
  if (doc.exists) {
    console.log(`Tokens found for user ${userId}`);
    return doc.data()?.tokens as Credentials;
  } else {
    console.log(`No tokens found for user ${userId}`);
    return null;
  }
}

/**
 * Get a Google Calendar API client with the user's credentials.
 * @param {string} userId The user's ID.
 * @return {Promise<calendar_v3.Calendar | null>} A promise that resolves with the calendar client.
 */
export async function getCalendarClient(
  userId: string,
): Promise<calendar_v3.Calendar | null> {
  const tokens = await loadTokensFromFirestore(userId);
  if (!tokens) {
    console.log(
      `No tokens available for user ${userId}. Cannot get calendar client.`,
    );
    return null;
  }

  const oAuth2Client = new google.auth.OAuth2(
    googleClientId.value(),
    googleClientSecret.value(),
  );
  oAuth2Client.setCredentials(tokens);

  // Listen for token refresh events and save the new tokens
  oAuth2Client.on('tokens', (newTokens) => {
    const updatedTokens: Credentials = { ...tokens, ...newTokens };
    saveUserTokens(userId, updatedTokens);
    console.log(`Tokens refreshed and saved for user ${userId}`);
  });

  console.log(`Calendar client created for user ${userId}`);
  return google.calendar({ version: 'v3', auth: oAuth2Client });
}

/**
 * Retrieve calendar events within a time range.
 * @param {string} userId The user's ID.
 * @param {string} calendarId The calendar ID.
 * @param {Object} options Optional parameters for filtering events.
 * @return {Promise<calendar_v3.Schema$Event[] | null>} A promise that resolves with the list of events.
 */
export async function getCalendarEvents(
  userId: string,
  calendarId: string,
  options: { timeMin?: string; timeMax?: string } = {},
): Promise<calendar_v3.Schema$Event[] | null> {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return null;
  }

  const { timeMin, timeMax } = options;

  // Build list parameters
  const listParams: calendar_v3.Params$Resource$Events$List = {
    calendarId: calendarId,
    maxResults: 2500, // Get all events, not just 20
    singleEvents: true,
  };

  // If time filters are provided, use them and enable ordering
  if (timeMin || timeMax) {
    if (timeMin) {
      listParams.timeMin = timeMin;
    }
    if (timeMax) {
      listParams.timeMax = timeMax;
    }
    listParams.orderBy = 'startTime'; // Only works with timeMin
  } else {
    // No time filters - get ALL events (no date restriction)
    // Don't use orderBy without timeMin (Google Calendar API requirement)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    listParams.timeMin = oneYearAgo.toISOString();
  }

  const res = await calendarClient.events.list(listParams);

  return res.data.items || null;
}

/**
 * Checks if the user has valid calendar access tokens.
 * @param {string} userId The user's ID.
 * @return {Promise<boolean>} A promise that resolves with true if tokens exist, false otherwise.
 */
export async function hasCalendarAccess(userId: string): Promise<boolean> {
  const tokens = await loadTokensFromFirestore(userId);
  return !!tokens;
}

/**
 * Create a new calendar event.
 * @param {string} userId The user's ID.
 * @param {calendar_v3.Schema$Event} event The event to create.
 * @return {Promise<calendar_v3.Schema$Event | null>} A promise that resolves with the created event.
 */
export async function createCalendarEvent(
  userId: string,
  calendarId: string,
  event: calendar_v3.Schema$Event,
): Promise<calendar_v3.Schema$Event | null> {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return null;
  }

  const res = await calendarClient.events.insert({
    calendarId: calendarId,
    requestBody: event,
  });

  return res.data;
}

/**
 * Update an existing calendar event.
 * @param {string} userId The user's ID.
 * @param {string} eventId The ID of the event to update.
 * @param {calendar_v3.Schema$Event} event The updated event data.
 * @return {Promise<calendar_v3.Schema$Event | null>} A promise that resolves with the updated event.
 */
export async function updateCalendarEvent(
  userId: string,
  calendarId: string,
  eventId: string,
  event: calendar_v3.Schema$Event,
): Promise<calendar_v3.Schema$Event | null> {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return null;
  }

  const res = await calendarClient.events.update({
    calendarId: calendarId,
    eventId,
    requestBody: event,
  });

  return res.data;
}

/**
 * Delete a calendar event.
 * @param {string} userId The user's ID.
 * @param {string} eventId The ID of the event to delete.
 * @return {Promise<void>} A promise that resolves when the event is deleted.
 */
export async function deleteCalendarEvent(
  userId: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return;
  }

  await calendarClient.events.delete({
    calendarId: calendarId,
    eventId,
  });
}
