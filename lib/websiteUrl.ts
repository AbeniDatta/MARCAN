export type ValidateWebsiteUrlResult =
  | { valid: true; normalized: string | null }
  | { valid: false };

/**
 * Validates an optional website field. Empty / whitespace-only is valid (normalized null).
 * Accepts absolute http(s) URLs or hostnames/paths with https:// prepended when no scheme is present.
 */
export function validateWebsiteUrl(raw: unknown): ValidateWebsiteUrlResult {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return { valid: true, normalized: null };

  let candidate = s;
  if (!/^https?:\/\//i.test(s)) {
    candidate = `https://${s}`;
  }
  try {
    const u = new URL(candidate);
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !u.hostname) {
      return { valid: false };
    }
    return { valid: true, normalized: u.href };
  } catch {
    return { valid: false };
  }
}
