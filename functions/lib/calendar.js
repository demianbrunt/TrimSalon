"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarErrorType =
  exports.googleClientSecret =
  exports.googleClientId =
    void 0;
exports.appointmentToCalendarEvent = appointmentToCalendarEvent;
exports.categorizeCalendarError = categorizeCalendarError;
exports.markSyncNeedsReauth = markSyncNeedsReauth;
exports.clearSyncStatus = clearSyncStatus;
exports.isSignificantChange = isSignificantChange;
exports.exchangeCodeForTokens = exchangeCodeForTokens;
exports.saveUserTokens = saveUserTokens;
exports.removeUserTokens = removeUserTokens;
exports.loadTokensFromFirestore = loadTokensFromFirestore;
exports.getCalendarClient = getCalendarClient;
exports.ensureTrimSalonCalendar = ensureTrimSalonCalendar;
exports.getCalendarEvents = getCalendarEvents;
exports.hasCalendarAccess = hasCalendarAccess;
exports.createCalendarEvent = createCalendarEvent;
exports.updateCalendarEvent = updateCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
const googleapis_1 = require("googleapis");
// Use Firebase Secret Manager for Google OAuth credentials.
exports.googleClientId = (0, params_1.defineSecret)("GOOGLE_CLIENT_ID");
exports.googleClientSecret = (0, params_1.defineSecret)("GOOGLE_CLIENT_SECRET");
// App configuration
const APP_BASE_URL = "https://trim.demianbrunt.nl";
const SALON_NAME = "Marlie's Trimsalon";
/**
 * Google Calendar color IDs mapped to appointment statuses.
 * See: https://developers.google.com/calendar/api/v3/reference/colors/get
 *
 * Available colors:
 * 1 = Lavender, 2 = Sage, 3 = Grape, 4 = Flamingo, 5 = Banana,
 * 6 = Tangerine, 7 = Peacock, 8 = Graphite, 9 = Blueberry, 10 = Basil, 11 = Tomato
 */
const CALENDAR_COLORS = {
  DEFAULT: "2", // Sage (Green) - matches app theme preference
  COMPLETED: "2", // Sage (Green) - success
  CANCELLED: "8", // Graphite (Gray) - inactive
};
/**
 * Transform an Appointment object to a Google Calendar Event schema.
 * @param {AppointmentData} appointment The appointment object from Firestore.
 * @param {boolean} includeId Whether to include the id field (for updates, not for creates).
 * @return {calendar_v3.Schema$Event} The transformed Google Calendar event.
 */
function appointmentToCalendarEvent(appointment, includeId = false) {
  const dogName = appointment.dog?.name || "Onbekende Hond";
  const clientName = appointment.client?.name || "Onbekende Klant";
  const breed = appointment.dog?.breed?.name || "";
  const gender =
    appointment.dog?.gender === "male"
      ? "Reu"
      : appointment.dog?.gender === "female"
        ? "Teefje"
        : "";
  const services =
    appointment.services?.map((s) => s.name).join(", ") || "Geen werkzaamheden";
  const packages = appointment.packages?.map((p) => p.name).join(", ") || "";
  const phone = appointment.client?.phone || "";
  const email = appointment.client?.email || "";
  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Amsterdam",
      });
    } catch {
      return isoString;
    }
  };
  const timeRange =
    appointment.startTime && appointment.endTime
      ? `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`
      : appointment.startTime
        ? `${formatTime(appointment.startTime)}`
        : "";
  // Professional title format
  const summary = `🐕 ${dogName} - ${clientName}`;
  // Build rich description with deep link
  const descriptionParts = [
    appointment.dog?.isAggressive
      ? "⚠️ WAARSCHUWING: HOND IS AGRESSIEF ⚠️"
      : "",
    gender
      ? `⚧ Geslacht: ${gender}${appointment.dog?.isNeutered ? " (Gecastreerd)" : ""}`
      : "",
    `📋 Werkzaamheden: ${services}`,
    packages ? `📦 Pakketten: ${packages}` : "",
    breed ? `🐾 Ras: ${breed}` : "",
    phone ? `📞 Telefoon: ${phone}` : "",
    email ? `✉️ Email: ${email}` : "",
    timeRange ? `⏰ Tijd: ${timeRange}` : "",
    appointment.notes ? `📝 Notities: ${appointment.notes}` : "",
    "",
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📱 Open in app:`,
    appointment.id
      ? `${APP_BASE_URL}/appointments/${appointment.id}`
      : "Link wordt beschikbaar na opslaan",
  ].filter(Boolean);
  const description = descriptionParts.join("\n");
  // Determine color based on status
  let colorId = CALENDAR_COLORS.DEFAULT;
  if (appointment.completed) {
    colorId = CALENDAR_COLORS.COMPLETED;
  } else if (appointment.deletedAt) {
    colorId = CALENDAR_COLORS.CANCELLED;
  }
  const event = {
    summary,
    description,
    location: SALON_NAME,
    start: {
      dateTime: appointment.startTime,
      timeZone: "Europe/Amsterdam",
    },
    end: {
      dateTime: appointment.endTime,
      timeZone: "Europe/Amsterdam",
    },
    colorId,
    // Extended properties for two-way sync (future use)
    extendedProperties: {
      private: {
        appointmentId: appointment.id || "",
        source: "trimsalon-app",
      },
    },
  };
  // Only include ID for updates, not for new events
  if (includeId && appointment.id) {
    event.id = appointment.id;
  }
  return event;
}
/**
 * Error types for calendar operations.
 */
var CalendarErrorType;
(function (CalendarErrorType) {
  CalendarErrorType["AUTH_EXPIRED"] = "AUTH_EXPIRED";
  CalendarErrorType["RATE_LIMITED"] = "RATE_LIMITED";
  CalendarErrorType["NOT_FOUND"] = "NOT_FOUND";
  CalendarErrorType["UNKNOWN"] = "UNKNOWN";
})(CalendarErrorType || (exports.CalendarErrorType = CalendarErrorType = {}));
/**
 * Analyze a calendar API error and return the error type.
 * @param {unknown} error The error to analyze.
 * @return {CalendarErrorType} The categorized error type.
 */
function categorizeCalendarError(error) {
  const errorMessage = error?.message || "";
  const errorCode = error?.code;
  // Auth errors - token expired or revoked
  if (
    errorMessage.includes("invalid_grant") ||
    errorMessage.includes("Token has been expired or revoked") ||
    errorCode === 401
  ) {
    return CalendarErrorType.AUTH_EXPIRED;
  }
  // Rate limiting
  if (errorCode === 429 || errorMessage.includes("Rate Limit Exceeded")) {
    return CalendarErrorType.RATE_LIMITED;
  }
  // Not found
  if (errorCode === 404) {
    return CalendarErrorType.NOT_FOUND;
  }
  return CalendarErrorType.UNKNOWN;
}
/**
 * Mark user's Google sync as needing re-authorization.
 * @param {string} userId The user's ID.
 * @return {Promise<void>} A promise that resolves when the status is updated.
 */
async function markSyncNeedsReauth(userId) {
  const firestore = admin.firestore();
  const userRef = firestore.collection("users").doc(userId);
  await userRef.set(
    {
      googleSyncStatus: "NEEDS_REAUTH",
      googleSyncStatusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Google sync marked as needing re-auth for user ${userId}`);
}
/**
 * Clear the user's sync error status (call after successful re-auth).
 * @param {string} userId The user's ID.
 * @return {Promise<void>} A promise that resolves when the status is cleared.
 */
async function clearSyncStatus(userId) {
  const firestore = admin.firestore();
  const userRef = firestore.collection("users").doc(userId);
  await userRef.set(
    {
      googleSyncStatus: "OK",
      googleSyncStatusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Google sync status cleared for user ${userId}`);
}
/**
 * Check if an appointment update is significant enough to sync to Google.
 * Prevents unnecessary API calls for irrelevant changes.
 * @param {AppointmentData | null} before The appointment data before the change.
 * @param {AppointmentData | null} after The appointment data after the change.
 * @return {boolean} True if the change should trigger a sync.
 */
function isSignificantChange(before, after) {
  // Fields that matter for Google Calendar
  const relevantFields = [
    "startTime",
    "endTime",
    "dog",
    "client",
    "services",
    "packages",
    "notes",
    "completed",
    "deletedAt",
  ];
  for (const field of relevantFields) {
    const beforeValue = JSON.stringify(before?.[field]);
    const afterValue = JSON.stringify(after?.[field]);
    if (beforeValue !== afterValue) {
      return true;
    }
  }
  return false;
}
/**
 * Exchange an authorization code for OAuth 2.0 tokens.
 * @param {string} code The authorization code from the client.
 * @return {Promise<Credentials>} A promise that resolves with the tokens.
 */
async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = exports.googleClientId.value().trim();
  const clientSecret = exports.googleClientSecret.value().trim();
  const oAuth2Client = new googleapis_1.google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
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
async function saveUserTokens(userId, tokens) {
  const firestore = admin.firestore();
  const userRef = firestore.collection("users").doc(userId);
  // Firestore does not accept `undefined` values. Google may omit fields like
  // `refresh_token` on subsequent authorizations, so we remove undefined fields
  // before persisting.
  const safeTokens = Object.fromEntries(
    Object.entries(tokens).filter(([, value]) => value !== undefined),
  );
  // Preserve an existing refresh token if Google doesn't return it again.
  const existingTokens = (await userRef.get()).data()?.tokens ?? {};
  const mergedTokens = {
    ...existingTokens,
    ...safeTokens,
  };
  await userRef.set({ tokens: mergedTokens }, { merge: true });
}
/**
 * Remove the user's tokens from Firestore (for expired/invalid tokens).
 * @param {string} userId The user's ID.
 * @return {Promise<void>} A promise that resolves when the tokens are removed.
 */
async function removeUserTokens(userId) {
  const firestore = admin.firestore();
  const userRef = firestore.collection("users").doc(userId);
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
async function loadTokensFromFirestore(userId) {
  const firestore = admin.firestore();
  const userRef = firestore.collection("users").doc(userId);
  const doc = await userRef.get();
  if (doc.exists) {
    console.log(`Tokens found for user ${userId}`);
    return doc.data()?.tokens;
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
async function getCalendarClient(userId) {
  const tokens = await loadTokensFromFirestore(userId);
  if (!tokens) {
    console.log(
      `No tokens available for user ${userId}. Cannot get calendar client.`,
    );
    return null;
  }
  const clientId = exports.googleClientId.value().trim();
  const clientSecret = exports.googleClientSecret.value().trim();
  const oAuth2Client = new googleapis_1.google.auth.OAuth2(
    clientId,
    clientSecret,
  );
  oAuth2Client.setCredentials(tokens);
  // Listen for token refresh events and save the new tokens
  oAuth2Client.on("tokens", (newTokens) => {
    const updatedTokens = { ...tokens, ...newTokens };
    saveUserTokens(userId, updatedTokens);
    console.log(`Tokens refreshed and saved for user ${userId}`);
  });
  console.log(`Calendar client created for user ${userId}`);
  return googleapis_1.google.calendar({ version: "v3", auth: oAuth2Client });
}
/**
 * Ensure the "TrimSalon" calendar exists for the user and return its ID.
 * This is useful for background sync where the calendar may not be initialized by the client.
 * @param {string} userId The user's ID.
 * @return {Promise<string | null>} The calendar ID or null if unavailable.
 */
async function ensureTrimSalonCalendar(userId) {
  try {
    const calendarClient = await getCalendarClient(userId);
    if (!calendarClient) {
      return null;
    }
    const list = await calendarClient.calendarList.list();
    const existing = list.data.items?.find(
      (item) => item?.summary === "TrimSalon" && item.id,
    );
    if (existing?.id) {
      return existing.id;
    }
    const created = await calendarClient.calendars.insert({
      requestBody: { summary: "TrimSalon" },
    });
    return created.data.id || null;
  } catch (error) {
    const errorType = categorizeCalendarError(error);
    if (errorType === CalendarErrorType.AUTH_EXPIRED) {
      await removeUserTokens(userId);
      await markSyncNeedsReauth(userId);
    }
    console.error("Failed to ensure TrimSalon calendar:", error);
    return null;
  }
}
/**
 * Retrieve calendar events within a time range.
 * @param {string} userId The user's ID.
 * @param {string} calendarId The calendar ID.
 * @param {Object} options Optional parameters for filtering events.
 * @return {Promise<calendar_v3.Schema$Event[] | null>} A promise that resolves with the list of events.
 */
async function getCalendarEvents(userId, calendarId, options = {}) {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return null;
  }
  const { timeMin, timeMax } = options;
  // Build list parameters
  const listParams = {
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
    listParams.orderBy = "startTime"; // Only works with timeMin
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
async function hasCalendarAccess(userId) {
  const tokens = await loadTokensFromFirestore(userId);
  return !!tokens;
}
/**
 * Create a new calendar event.
 * @param {string} userId The user's ID.
 * @param {calendar_v3.Schema$Event} event The event to create.
 * @return {Promise<calendar_v3.Schema$Event | null>} A promise that resolves with the created event.
 */
async function createCalendarEvent(userId, calendarId, event) {
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
async function updateCalendarEvent(userId, calendarId, eventId, event) {
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
async function deleteCalendarEvent(userId, calendarId, eventId) {
  const calendarClient = await getCalendarClient(userId);
  if (!calendarClient) {
    return;
  }
  try {
    // Safety check: Verify ownership before deletion
    // We fetch the event first to check the 'source' property
    const existingEvent = await calendarClient.events.get({
      calendarId,
      eventId,
    });
    const source = existingEvent.data.extendedProperties?.private?.["source"];
    // Only delete if it was created by our app
    if (source === "trimsalon-app") {
      await calendarClient.events.delete({
        calendarId: calendarId,
        eventId,
      });
      console.log(`Deleted app-owned event ${eventId}`);
    } else {
      console.warn(
        `Blocked deletion of external event ${eventId} (Source: ${source})`,
      );
    }
  } catch (error) {
    // If event is already gone (404), we consider the deletion successful
    const errorType = categorizeCalendarError(error);
    if (errorType === CalendarErrorType.NOT_FOUND) {
      console.log(`Event ${eventId} already deleted or not found.`);
      return;
    }
    // Re-throw other errors to be handled by the caller
    throw error;
  }
}
//# sourceMappingURL=calendar.js.map
