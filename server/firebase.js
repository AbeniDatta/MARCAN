const admin = require("firebase-admin");

// Initialize Firebase Admin with environment variables
try {
  let credentials;

  // Option 1: Single JSON blob (preferred in many hosts)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      // Some hosts escape newlines in privateKey inside JSON too
      if (json.private_key) json.private_key = json.private_key.replace(/\\n/g, "\n");
      credentials = json;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Falling back to individual vars.");
    }
  }

  // Option 2: Individual env vars
  if (!credentials) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase credentials. Provide FIREBASE_SERVICE_ACCOUNT (JSON) or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
      );
    }

    credentials = {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: credentials.project_id || credentials.projectId,
      clientEmail: credentials.client_email || credentials.clientEmail,
      privateKey: credentials.private_key || credentials.privateKey,
    }),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  throw error;
}

module.exports = admin;