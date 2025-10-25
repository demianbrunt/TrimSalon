"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCalendar =
  exports.listCalendars =
  exports.deleteCalendarEvent =
  exports.updateCalendarEvent =
  exports.createCalendarEvent =
  exports.hasCalendarAccess =
  exports.getCalendarEvents =
  exports.exchangeAuthCode =
  exports.beforeusercreate =
    void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const identity_1 = require("firebase-functions/v2/identity");
const calendar = require("./calendar");
admin.initializeApp();
exports.beforeusercreate = (0, identity_1.beforeUserCreated)(
  {
    region: "europe-west1",
  },
  async (event) => {
    const user = event.data;
    const email = user?.email;
    if (!email) {
      throw new identity_1.HttpsError("invalid-argument", "Email is required.");
    }
    const firestore = admin.firestore();
    const allowedUsersCollection = firestore.collection("allowed-users");
    try {
      const snapshot = await allowedUsersCollection
        .where("email", "==", email.toLowerCase())
        .get();
      if (snapshot.empty) {
        console.log(
          `User ${email} is not in the allowed list. Blocking creation.`,
        );
        throw new identity_1.HttpsError(
          "permission-denied",
          "This email address is not authorized to create a user.",
        );
      }
    } catch (error) {
      console.error("Error checking for allowed user:", error);
      throw new identity_1.HttpsError(
        "internal",
        "An error occurred while validating the user.",
      );
    }
    console.log(`User ${email} is allowed.`);
  },
);
exports.exchangeAuthCode = (0, https_1.onCall)(async (request) => {
  const { code, userId } = request.data;
  if (!code || !userId) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with arguments "code" and "userId".',
    );
  }
  try {
    const tokens = await calendar.exchangeCodeForTokens(code);
    await calendar.saveUserTokens(userId, tokens);
    return { success: true };
  } catch (error) {
    console.error("Error exchanging auth code or saving tokens:", error);
    throw new identity_1.HttpsError(
      "internal",
      "Failed to process calendar authorization.",
    );
  }
});
exports.getCalendarEvents = (0, https_1.onCall)(async (request) => {
  const { userId, timeMin, timeMax } = request.data;
  if (!userId) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with the argument "userId".',
    );
  }
  try {
    const events = await calendar.getCalendarEvents(userId, {
      timeMin,
      timeMax,
    });
    return { events };
  } catch (error) {
    console.error("Error getting calendar events:", error);
    throw new identity_1.HttpsError(
      "internal",
      "Failed to retrieve calendar events.",
    );
  }
});
exports.hasCalendarAccess = (0, https_1.onCall)(async (request) => {
  const { userId } = request.data;
  if (!userId) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with the argument "userId".',
    );
  }
  try {
    const hasAccess = await calendar.hasCalendarAccess(userId);
    return { hasAccess };
  } catch (error) {
    console.error("Error checking for calendar access:", error);
    throw new identity_1.HttpsError(
      "internal",
      "Failed to check for calendar access.",
    );
  }
});
exports.createCalendarEvent = (0, https_1.onCall)(async (request) => {
  const { userId, event } = request.data;
  if (!userId || !event) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with arguments "userId" and "event".',
    );
  }
  try {
    const newEvent = await calendar.createCalendarEvent(userId, event);
    return { event: newEvent };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw new identity_1.HttpsError(
      "internal",
      "Failed to create calendar event.",
    );
  }
});
exports.updateCalendarEvent = (0, https_1.onCall)(async (request) => {
  const { userId, eventId, event } = request.data;
  if (!userId || !eventId || !event) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with arguments "userId", "eventId", and "event".',
    );
  }
  try {
    const updatedEvent = await calendar.updateCalendarEvent(
      userId,
      eventId,
      event,
    );
    return { event: updatedEvent };
  } catch (error) {
    console.error("Error updating calendar event:", error);
    throw new identity_1.HttpsError(
      "internal",
      "Failed to update calendar event.",
    );
  }
});
exports.deleteCalendarEvent = (0, https_1.onCall)(async (request) => {
  const { userId, eventId } = request.data;
  if (!userId || !eventId) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with arguments "userId" and "eventId".',
    );
  }
  try {
    await calendar.deleteCalendarEvent(userId, eventId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw new identity_1.HttpsError(
      "internal",
      "Failed to delete calendar event.",
    );
  }
});
exports.listCalendars = (0, https_1.onCall)(async (request) => {
  const { userId } = request.data;
  if (!userId) {
    throw new identity_1.HttpsError(
      "invalid-argument",
      'The function must be called with the argument "userId".',
    );
  }
  try {
    const calendarClient = await calendar.getCalendarClient(userId);
    if (!calendarClient) {
      throw new identity_1.HttpsError(
        "unauthenticated",
        "User is not authenticated.",
      );
    }
    const calendars = await calendarClient.calendarList.list();
    return { items: calendars.data.items };
  } catch (error) {
    console.error("Error listing calendars:", error);
    throw new identity_1.HttpsError("internal", "Failed to list calendars.");
  }
});
exports.createCalendar = (0, https_1.onCall)(
  { region: "europe-west1" },
  async (request) => {
    const { userId, summary } = request.data;
    if (!userId || !summary) {
      throw new identity_1.HttpsError(
        "invalid-argument",
        'The function must be called with arguments "userId" and "summary".',
      );
    }
    try {
      const calendarClient = await calendar.getCalendarClient(userId);
      if (!calendarClient) {
        throw new identity_1.HttpsError(
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
      throw new identity_1.HttpsError("internal", "Failed to create calendar.");
    }
  },
);
//# sourceMappingURL=index.js.map
