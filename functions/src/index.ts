import * as admin from 'firebase-admin';
import {
  AuthBlockingEvent,
  beforeUserCreated,
  HttpsError,
} from 'firebase-functions/v2/identity';
import { onCall } from 'firebase-functions/v2/https';
import * as calendar from './calendar';

admin.initializeApp();

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

export const exchangeAuthCode = onCall(async (request) => {
  const { code, userId } = request.data;

  if (!code || !userId) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with arguments "code" and "userId".',
    );
  }

  try {
    const tokens = await calendar.exchangeCodeForTokens(code);
    await calendar.saveUserTokens(userId, tokens);
    return { success: true };
  } catch (error) {
    console.error('Error exchanging auth code or saving tokens:', error);
    throw new HttpsError(
      'internal',
      'Failed to process calendar authorization.',
    );
  }
});

export const getCalendarEvents = onCall(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with the argument "userId".',
    );
  }

  try {
    const events = await calendar.getCalendarEvents(userId);
    return { events };
  } catch (error) {
    console.error('Error getting calendar events:', error);
    throw new HttpsError('internal', 'Failed to retrieve calendar events.');
  }
});
