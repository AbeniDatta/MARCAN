export const INDUSTRY_HUBS_EN = [
  'Precision Machining',
  'Foundries & Casting',
  'Surface Finishing',
  'Tooling & Molds',
  'Automation',
  'Additive Manufacturing',
  'Manufacturing Support',
] as const;

const CANONICAL_BY_LOWER: Record<string, string> = {
  // English canonical (case-insensitive)
  'precision machining': 'Precision Machining',
  'foundries & casting': 'Foundries & Casting',
  'foundries and casting': 'Foundries & Casting',
  'surface finishing': 'Surface Finishing',
  'tooling & molds': 'Tooling & Molds',
  'tooling and molds': 'Tooling & Molds',
  automation: 'Automation',
  'additive manufacturing': 'Additive Manufacturing',
  '3d printing': 'Additive Manufacturing',
  '3-d printing': 'Additive Manufacturing',
  'additive': 'Additive Manufacturing',
  'manufacturing support': 'Manufacturing Support',
  'mfg support': 'Manufacturing Support',
  'manufacturing services': 'Manufacturing Support',

  // French -> English
  'usinage de precision': 'Precision Machining',
  'usinnage de precision': 'Precision Machining', // common misspelling safeguard
  'fonderies et moulage': 'Foundries & Casting',
  'fonderies & moulage': 'Foundries & Casting',
  'finitions de surface': 'Surface Finishing',
  'finition de surface': 'Surface Finishing',
  'outillage et moules': 'Tooling & Molds',
  'automatisation': 'Automation',
  'fabrication additive': 'Additive Manufacturing',
  'impression 3d': 'Additive Manufacturing',
};

function stripAccents(input: string): string {
  // Normalize and remove diacritics (works for latin-based strings).
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeIndustryHubName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const key = stripAccents(trimmed).toLowerCase();

  // Exact/alias match first.
  if (CANONICAL_BY_LOWER[key]) return CANONICAL_BY_LOWER[key];

  // Fuzzy contains match (handles minor punctuation differences).
  for (const [lower, canonical] of Object.entries(CANONICAL_BY_LOWER)) {
    if (!lower || !canonical) continue;
    if (lower === key) return canonical;
    if (key.includes(lower)) return canonical;
    if (lower.includes(key)) return canonical;
  }

  return null;
}

export function normalizeIndustriesServed(industriesServed: unknown): string[] {
  if (!Array.isArray(industriesServed)) return [];

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of industriesServed) {
    const hub = normalizeIndustryHubName(item);
    if (!hub) continue;
    if (seen.has(hub)) continue;
    seen.add(hub);
    normalized.push(hub);
  }

  return normalized;
}

