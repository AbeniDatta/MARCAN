/**
 * Resolve marketplace role from the database for the signed-in email.
 * Priority: supplier > storefront seller > buyer (matches my-account behavior).
 */
export type MarcanAccountRole = 'buyer' | 'supplier' | 'seller' | 'admin';

export async function fetchAccountRoleFromApi(email: string): Promise<MarcanAccountRole | null> {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const res = await fetch(`/api/account-role?email=${encodeURIComponent(normalized)}`, {
    credentials: 'same-origin',
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { role?: MarcanAccountRole | null };
  return data.role ?? null;
}
