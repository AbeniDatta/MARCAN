/**
 * Canadian province / territory names and abbreviations → two-letter code (uppercase).
 */
const PROVINCE_ALIASES: Record<string, string> = {
  on: 'ON',
  ontario: 'ON',
  qc: 'QC',
  quebec: 'QC',
  québec: 'QC',
  bc: 'BC',
  'british columbia': 'BC',
  ab: 'AB',
  alberta: 'AB',
  mb: 'MB',
  manitoba: 'MB',
  sk: 'SK',
  saskatchewan: 'SK',
  ns: 'NS',
  'nova scotia': 'NS',
  nb: 'NB',
  'new brunswick': 'NB',
  nl: 'NL',
  'newfoundland': 'NL',
  'newfoundland and labrador': 'NL',
  pe: 'PE',
  'prince edward island': 'PE',
  nt: 'NT',
  'northwest territories': 'NT',
  nu: 'NU',
  nunavut: 'NU',
  yt: 'YT',
  yukon: 'YT',
};

const KNOWN_CODES = new Set(['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'NU', 'YT']);

/**
 * Normalize a user- or model-provided province string to a 2-letter code when possible.
 */
export function normalizeProvinceCode(input: string | null | undefined): string | null {
  if (input == null || String(input).trim() === '') return null;
  const t = String(input).trim();
  const upper = t.toUpperCase();
  if (KNOWN_CODES.has(upper)) return upper;
  const key = t.toLowerCase().replace(/\./g, '');
  return PROVINCE_ALIASES[key] ?? PROVINCE_ALIASES[key.replace(/\s+/g, ' ')] ?? null;
}

/**
 * Slug for taxonomy keys: lowercase, underscores, no leading/trailing noise.
 */
export function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * Deduplicate string lists case-insensitively while preserving first-seen casing.
 */
export function dedupeStrings(values: string[] | undefined | null): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const s = String(v ?? '').trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

/**
 * Clamp confidence to [0, 1] for storage.
 */
export function clampConfidence(n: unknown): number {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/**
 * Strip fenced markdown from model output if present.
 */
export function stripJsonFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  return t.trim();
}

/**
 * Parse JSON safely — returns undefined on failure.
 */
export function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(stripJsonFence(raw));
  } catch {
    return undefined;
  }
}

/**
 * Truncate error text for DB storage.
 */
export function truncateError(message: string, max = 4000): string {
  if (message.length <= max) return message;
  return `${message.slice(0, max - 20)}…[truncated]`;
}

/** Human-readable Zod failure for `ai_error` (works with Zod 4 issues). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatZodError(err: { issues: any[] }): string {
  try {
    return err.issues
      .map((i) => {
        const p = Array.isArray(i.path) && i.path.length > 0 ? i.path.join('.') : '(root)';
        const extra =
          i.code === 'invalid_value' && 'input' in i && i.input !== undefined
            ? ` (received: ${JSON.stringify(i.input)})`
            : '';
        return `${p}: ${i.message}${extra}`;
      })
      .join('; ');
  } catch {
    return String(err);
  }
}
