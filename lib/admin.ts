export const ADMIN_EMAILS = ['marcan.initiative@gmail.com'] as const;

export function normalizeEmail(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && ADMIN_EMAILS.includes(normalized as (typeof ADMIN_EMAILS)[number]);
}
