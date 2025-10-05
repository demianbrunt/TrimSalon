import * as admin from 'firebase-admin';
import { defineString } from 'firebase-functions/params';
import { Credentials } from 'google-auth-library';
import { google } from 'googleapis';

const firestore = admin.firestore();

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
  const userRef = firestore.collection('users').doc(userId);
  const doc = await userRef.get();
  return doc.exists ? (doc.data()?.tokens as Credentials) : null;
}

/**
 * Get a Google Calendar API client with the user's credentials.
 * @param {string} userId The user's ID.
 * @return {Promise<any>} A promise that resolves with the calendar client.
 */
export async function getCalendarClient(userId: string) {
  const tokens = await loadTokensFromFirestore(userId);
  if (!tokens) {
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
  });

  return google.calendar({ version: 'v3', auth: oAuth2Client });
}

/**
 * Get calendar events for a user.
 * @param {string} userId The user's ID.
 * @return {Promise<any>} A promise that resolves with the calendar events.
 */
export async function getCalendarEvents(userId: string) {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return null;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Set timeMin to start of the day and timeMax to end of the day in ISO format
  const timeMin = dateStr + 'T00:00:00Z';
  const timeMax = dateStr + 'T23:59:59Z';

  const res = await calendarClient.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items;
}
