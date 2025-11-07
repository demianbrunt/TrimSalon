import * as admin from 'firebase-admin';
import { defineString } from 'firebase-functions/params';
import { Credentials } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

// Use Firebase's secret management for client ID and secret
const googleClientId = defineString('GOOGLE_CLIENT_ID');
const googleClientSecret = defineString('GOOGLE_CLIENT_SECRET');

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
 * Get calendar events for a user within a given time range.
 * @param {string} userId The user's ID.
 * @param {object} [options] Optional parameters.
 * @param {string} [options.timeMin] Start of the time range.
 * @param {string} [options.timeMax] End of the time range.
 * @return {Promise<calendar_v3.Schema$Event[] | null>} A promise that resolves with the calendar events.
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

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const res = await calendarClient.events.list({
    calendarId: calendarId,
    timeMin: timeMin || dateStr + 'T00:00:00Z',
    timeMax: timeMax || dateStr + 'T23:59:59Z',
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  });

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
