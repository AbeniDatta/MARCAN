import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK for server-side ID token verification and Auth user deletion.
 * Set FIREBASE_SERVICE_ACCOUNT_JSON to the full JSON of a service account key, or use
 * Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS) in supported environments.
 */
export function getFirebaseAdmin(): typeof admin | null {
  if (admin.apps.length > 0) {
    return admin;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  try {
    if (json?.trim()) {
      const cred = JSON.parse(json) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(cred),
      });
      return admin;
    }
    // Do not call initializeApp() with no credential — it leads to "Unable to detect a Project Id" on Auth ops.
    return null;
  } catch (e) {
    console.warn('[firebaseAdmin] initializeApp failed:', e);
    return null;
  }
}
