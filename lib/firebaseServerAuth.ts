/**
 * Server-side Firebase Auth helpers using Identity Toolkit REST (no service account).
 * Uses NEXT_PUBLIC_FIREBASE_API_KEY — the same key the web client already exposes.
 */

const IT_BASE = 'https://identitytoolkit.googleapis.com/v1';

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY is not set');
  }
  return apiKey;
}

export type FirebaseLookupUser = { uid: string; email: string };

/**
 * Verify ID token and resolve localId + email via accounts:lookup (official REST validation).
 */
export async function verifyFirebaseIdTokenViaLookup(idToken: string): Promise<FirebaseLookupUser> {
  const apiKey = getApiKey();
  const url = `${IT_BASE}/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    users?: Array<{ localId?: string; email?: string }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = json.error?.message || `accounts:lookup failed (${res.status})`;
    throw new Error(msg);
  }

  const u = json.users?.[0];
  if (!u?.localId) {
    throw new Error('Invalid or expired ID token');
  }

  const email = u.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('NO_EMAIL');
  }

  return { uid: u.localId, email };
}

/**
 * Delete the Auth user (revokes ID token) via accounts:delete.
 */
export async function deleteFirebaseUserWithIdToken(idToken: string): Promise<void> {
  const apiKey = getApiKey();
  const url = `${IT_BASE}/accounts:delete?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string; errors?: Array<{ message?: string }> };
  };

  if (!res.ok) {
    const msg =
      json.error?.message ||
      json.error?.errors?.[0]?.message ||
      `accounts:delete failed (${res.status})`;
    throw new Error(msg);
  }
}
