"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeusercreate = void 0;
const admin = require("firebase-admin");
const identity_1 = require("firebase-functions/v2/identity");
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
//# sourceMappingURL=index.js.map
