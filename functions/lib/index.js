"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAppointmentReminderEmail =
  exports.scheduledCalendarSync =
  exports.triggerCalendarSync =
  exports.createCalendar =
  exports.listCalendars =
  exports.deleteCalendarEvent =
  exports.updateCalendarEvent =
  exports.createCalendarEvent =
  exports.hasCalendarAccess =
  exports.getCalendarEvents =
  exports.exchangeAuthCode =
    void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const calendar = require("./calendar");
const calendar_1 = require("./calendar");
const email = require("./email");
const oauth_redirect_uri_1 = require("./oauth-redirect-uri");
// Background calendar sync settings (cost-aware)
const SYNC_LOOKAHEAD_DAYS = 30; // how far ahead we sync
const SYNC_LOOKBACK_DAYS = 7; // sync a limited window of past events
const SYNC_MAX_APPOINTMENTS = 150; // per run per user to cap API usage
function isHttpsErrorLike(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const candidate = error;
  return (
    typeof candidate.code === "string" &&
    // Present on Firebase Functions HttpsError objects; helps avoid false positives.
    typeof candidate.httpErrorCode === "object"
  );
}
function getGoogleOauthTokenError(error) {
  const candidate = error;
  const responseData = candidate?.response?.data;
  const responseError = responseData?.error;
  if (
    responseError === "invalid_client" ||
    responseError === "invalid_grant" ||
    responseError === "redirect_uri_mismatch"
  ) {
    return responseError;
  }
  const message =
    typeof candidate?.message === "string" ? candidate.message : "";
  if (message.includes("invalid_client")) return "invalid_client";
  if (message.includes("invalid_grant")) return "invalid_grant";
  if (message.includes("redirect_uri_mismatch")) return "redirect_uri_mismatch";
  return null;
}
function toDate(value) {
  if (!value) return null;
  if (typeof value === "string") return new Date(value);
  if (typeof value.toDate === "function") {
    return value.toDate();
  }
  return null;
}
async function syncUserAgenda(userId, calendarId, timeMin, timeMax) {
  const firestore = admin.firestore();
  // Fetch upcoming appointments within the window
  const appointmentsSnap = await firestore
    .collection("appointments")
    .where("startTime", ">=", timeMin)
    .where("startTime", "<=", timeMax)
    .orderBy("startTime", "asc")
    .limit(SYNC_MAX_APPOINTMENTS)
    .get();
  const appointments = appointmentsSnap.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }))
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
          e.id && e.extendedProperties?.private?.["source"] === "trimsalon-app",
      )
      .map((e) => [e.id, e]),
  );
  const processedGoogleIds = new Set();
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
        if (errorType === calendar_1.CalendarErrorType.NOT_FOUND) {
          // Event missing in Google, recreate
          const created = await calendar.createCalendarEvent(
            userId,
            calendarId,
            eventPayload,
          );
          if (created?.id) {
            await firestore.collection("appointments").doc(appointment.id).set(
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
        await firestore.collection("appointments").doc(appointment.id).set(
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
    appointments.map((a) => a.googleCalendarEventId).filter((id) => !!id),
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
exports.exchangeAuthCode = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    const allowedOrigins = new Set([
      "https://trimsalon-9b823.web.app",
      "https://trimsalon-9b823.firebaseapp.com",
      "https://trim.demianbrunt.nl",
      "http://localhost:4200",
    ]);
    const originHeader = request.rawRequest?.headers?.origin;
    const origin = typeof originHeader === "string" ? originHeader : "";
    // Google Identity Services (code flow) can result in different redirect_uri values
    // depending on UX mode and deployment domains. To reduce brittleness across
    // hosting domains (and avoid breaking users after domain changes), we retry the
    // token exchange for known-safe redirect_uri candidates.
    const redirectUriCandidates = (0,
    oauth_redirect_uri_1.buildRedirectUriCandidates)({
      origin,
      allowedOrigins,
      customDomain: "https://trim.demianbrunt.nl",
      firebaseHostingDomain: "https://trimsalon-9b823.web.app",
      firebaseAppDomain: "https://trimsalon-9b823.firebaseapp.com",
    });
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    const { code, clientId: clientClientId } = request.data;
    if (!code) {
      console.error("exchangeAuthCode: Missing code");
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with argument "code".',
      );
    }
    const serverClientId = calendar.googleClientId.value().trim();
    const serverClientSecret = calendar.googleClientSecret.value().trim();
    if (!serverClientId || !serverClientSecret) {
      throw new https_1.HttpsError(
        "failed-precondition",
        "Google Calendar integration is not configured (missing server OAuth credentials).",
      );
    }
    if (
      typeof clientClientId === "string" &&
      clientClientId.trim().length > 0 &&
      clientClientId.trim() !== serverClientId
    ) {
      throw new https_1.HttpsError(
        "failed-precondition",
        "Google Calendar integration is misconfigured (client ID mismatch between app and server).",
      );
    }
    try {
      console.log(`Attempting to exchange code for tokens for user ${userId}`);
      const tokens = await (0,
      oauth_redirect_uri_1.exchangeCodeWithRedirectUriFallback)({
        code,
        redirectUris: redirectUriCandidates,
        exchange: (c, redirectUri) =>
          calendar.exchangeCodeForTokens(c, redirectUri),
        getOauthError: getGoogleOauthTokenError,
      });
      console.log(
        `Token exchange succeeded for user ${userId}. refresh_token present: ${!!tokens.refresh_token}`,
      );
      console.log(`Tokens exchanged for user ${userId}. Saving tokens...`);
      await calendar.saveUserTokens(userId, tokens);
      await calendar.clearSyncStatus(userId);
      console.log(`Tokens saved for user ${userId}.`);
      return { success: true };
    } catch (error) {
      console.error("Error exchanging auth code or saving tokens:", error);
      const oauthError = getGoogleOauthTokenError(error);
      if (oauthError === "invalid_client") {
        throw new https_1.HttpsError(
          "failed-precondition",
          "Google Calendar integration is not configured correctly (invalid OAuth client credentials).",
        );
      }
      if (oauthError === "redirect_uri_mismatch") {
        throw new https_1.HttpsError(
          "failed-precondition",
          "Google Calendar redirect URI is not configured correctly. Please contact support.",
        );
      }
      if (oauthError === "invalid_grant") {
        throw new https_1.HttpsError(
          "invalid-argument",
          "Authorization code is invalid or expired. Please try again.",
        );
      }
      throw new https_1.HttpsError(
        "internal",
        "Failed to process calendar authorization.",
      );
    }
  },
);
exports.getCalendarEvents = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    const { calendarId, timeMin, timeMax } = request.data;
    if (!calendarId) {
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with the argument "calendarId".',
      );
    }
    try {
      const events = await calendar.getCalendarEvents(userId, calendarId, {
        timeMin,
        timeMax,
      });
      return { events: events || [] };
    } catch (error) {
      console.error("Error getting calendar events:", error);
      const errorType = calendar.categorizeCalendarError(error);
      if (errorType === calendar_1.CalendarErrorType.AUTH_EXPIRED) {
        // Remove invalid tokens and mark for re-auth
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new https_1.HttpsError(
          "unauthenticated",
          "Calendar authorization has expired. Please re-authorize calendar access.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.RATE_LIMITED) {
        throw new https_1.HttpsError(
          "resource-exhausted",
          "Google Calendar rate limit exceeded. Please try again later.",
        );
      }
      throw new https_1.HttpsError(
        "internal",
        "Failed to retrieve calendar events.",
      );
    }
  },
);
exports.hasCalendarAccess = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    try {
      const hasAccess = await calendar.hasCalendarAccess(userId);
      return { hasAccess };
    } catch (error) {
      console.error("Error checking for calendar access:", error);
      throw new https_1.HttpsError(
        "internal",
        "Failed to check for calendar access.",
      );
    }
  },
);
exports.createCalendarEvent = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    const { calendarId, event } = request.data;
    if (!calendarId || !event) {
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with arguments "calendarId" and "event".',
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
    } catch (error) {
      console.error("Error creating calendar event:", error);
      const errorType = calendar.categorizeCalendarError(error);
      if (errorType === calendar_1.CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new https_1.HttpsError(
          "unauthenticated",
          "Calendar authorization has expired. Please re-authorize calendar access.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.RATE_LIMITED) {
        throw new https_1.HttpsError(
          "resource-exhausted",
          "Google Calendar rate limit exceeded. Please try again later.",
        );
      }
      throw new https_1.HttpsError(
        "internal",
        "Failed to create calendar event.",
      );
    }
  },
);
exports.updateCalendarEvent = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    const { calendarId, eventId, event } = request.data;
    if (!calendarId || !eventId || !event) {
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with arguments "calendarId", "eventId", and "event".',
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
    } catch (error) {
      console.error("Error updating calendar event:", error);
      const errorType = calendar.categorizeCalendarError(error);
      if (errorType === calendar_1.CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new https_1.HttpsError(
          "unauthenticated",
          "Calendar authorization has expired. Please re-authorize calendar access.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.RATE_LIMITED) {
        throw new https_1.HttpsError(
          "resource-exhausted",
          "Google Calendar rate limit exceeded. Please try again later.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.NOT_FOUND) {
        // Event doesn't exist in Google, might have been deleted manually
        console.warn(`Calendar event ${eventId} not found, skipping update.`);
        return { event: null, warning: "Event not found in calendar" };
      }
      throw new https_1.HttpsError(
        "internal",
        "Failed to update calendar event.",
      );
    }
  },
);
exports.deleteCalendarEvent = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    const { calendarId, eventId } = request.data;
    if (!calendarId || !eventId) {
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with arguments "calendarId" and "eventId".',
      );
    }
    try {
      await calendar.deleteCalendarEvent(userId, calendarId, eventId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      const errorType = calendar.categorizeCalendarError(error);
      if (errorType === calendar_1.CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new https_1.HttpsError(
          "unauthenticated",
          "Calendar authorization has expired. Please re-authorize calendar access.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.RATE_LIMITED) {
        throw new https_1.HttpsError(
          "resource-exhausted",
          "Google Calendar rate limit exceeded. Please try again later.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.NOT_FOUND) {
        // Event already deleted, that's fine
        console.warn(`Calendar event ${eventId} not found, already deleted.`);
        return { success: true, warning: "Event was already deleted" };
      }
      throw new https_1.HttpsError(
        "internal",
        "Failed to delete calendar event.",
      );
    }
  },
);
exports.listCalendars = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    try {
      const calendarClient = await calendar.getCalendarClient(userId);
      if (!calendarClient) {
        throw new https_1.HttpsError(
          "unauthenticated",
          "User is not authenticated.",
        );
      }
      const calendars = await calendarClient.calendarList.list();
      return { items: calendars.data.items };
    } catch (error) {
      console.error("Error listing calendars:", error);
      // If we intentionally threw an HttpsError (e.g. unauthenticated), do not wrap it.
      if (error instanceof https_1.HttpsError || isHttpsErrorLike(error)) {
        throw error;
      }
      const errorType = calendar.categorizeCalendarError(error);
      if (errorType === calendar_1.CalendarErrorType.AUTH_EXPIRED) {
        await calendar.removeUserTokens(userId);
        await calendar.markSyncNeedsReauth(userId);
        throw new https_1.HttpsError(
          "unauthenticated",
          "Calendar authorization has expired. Please re-authorize calendar access.",
        );
      }
      if (errorType === calendar_1.CalendarErrorType.RATE_LIMITED) {
        throw new https_1.HttpsError(
          "resource-exhausted",
          "Google Calendar rate limit exceeded. Please try again later.",
        );
      }
      throw new https_1.HttpsError("internal", "Failed to list calendars.");
    }
  },
);
exports.createCalendar = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }
    const userId = request.auth.uid;
    const { summary } = request.data;
    if (!summary) {
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with the argument "summary".',
      );
    }
    try {
      const calendarClient = await calendar.getCalendarClient(userId);
      if (!calendarClient) {
        throw new https_1.HttpsError(
          "unauthenticated",
          "User is not authenticated.",
        );
      }
      const newCalendar = await calendarClient.calendars.insert({
        requestBody: {
          summary,
        },
      });
      return newCalendar.data;
    } catch (error) {
      console.error("Error creating calendar:", error);
      // If we intentionally threw an HttpsError (e.g. unauthenticated), do not wrap it.
      if (error instanceof https_1.HttpsError || isHttpsErrorLike(error)) {
        throw error;
      }
      throw new https_1.HttpsError("internal", "Failed to create calendar.");
    }
  },
);
// Manual trigger for calendar sync
exports.triggerCalendarSync = (0, https_1.onCall)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new https_1.HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
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
        throw new https_1.HttpsError(
          "failed-precondition",
          "No calendar access. Please link your account first.",
        );
      }
      const calendarId = await calendar.ensureTrimSalonCalendar(userId);
      if (!calendarId) {
        throw new https_1.HttpsError(
          "internal",
          "TrimSalon calendar unavailable. Please try again.",
        );
      }
      await syncUserAgenda(userId, calendarId, timeMin, timeMax);
      return { success: true };
    } catch (error) {
      console.error("Manual sync failed:", error);
      // Re-throw HttpsErrors, wrap others
      if (error instanceof https_1.HttpsError) {
        throw error;
      }
      throw new https_1.HttpsError("internal", "Sync failed.");
    }
  },
);
// Scheduled background sync (cost-aware, limited scope)
exports.scheduledCalendarSync = (0, scheduler_1.onSchedule)(
  {
    region: "europe-west1",
    secrets: [calendar.googleClientId, calendar.googleClientSecret],
    schedule: "every 2 hours",
    timeZone: "Europe/Amsterdam",
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    const firestore = admin.firestore();
    const allowedUsersSnap = await firestore.collection("allowed-users").get();
    if (allowedUsersSnap.empty) {
      console.log("No allowed users configured, skipping background sync.");
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
      const email = doc.id || doc.data().email;
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
exports.sendAppointmentReminderEmail = (0, https_1.onCall)(
  { region: "europe-west1" },
  async (request) => {
    const { to, appointment } = request.data;
    if (!to || !appointment) {
      throw new https_1.HttpsError(
        "invalid-argument",
        'The function must be called with arguments "to" and "appointment".',
      );
    }
    try {
      await email.sendAppointmentReminder(to, appointment);
      return { success: true };
    } catch (error) {
      console.error("Error sending appointment reminder:", error);
      throw new https_1.HttpsError(
        "internal",
        "Failed to send appointment reminder email.",
      );
    }
  },
);
//# sourceMappingURL=index.js.map
