import { z } from 'zod';

/**
 * Open models often emit `entity_type` with different casing, spacing, or synonyms.
 * Normalize so `z.literal(...)` validation matches.
 */
function normalizeEntityTypeKey(v: unknown): string {
  let x = v;
  while (Array.isArray(x) && x.length === 1) x = x[0];
  return String(x ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[''″`]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function entityTypeLiteral(
  canonical:
    | 'supplier_profile'
    | 'buyer_profile'
    | 'storefront_profile'
    | 'sourcing_request'
    | 'storefront_listing',
  aliases: string[]
): z.ZodType<typeof canonical> {
  const aliasNorm = new Set(
    [canonical, ...aliases].map((s) => normalizeEntityTypeKey(s)).filter(Boolean)
  );
  return z.preprocess((v: unknown) => {
    const key = normalizeEntityTypeKey(v);
    if (!key || aliasNorm.has(key)) return canonical;
    const compact = key.replace(/_/g, '');
    for (const a of Array.from(aliasNorm)) {
      if (a.replace(/_/g, '') === compact) return canonical;
    }
    // Supplier pipeline only sees supplier-shaped payloads — default missing/garbled labels.
    return canonical;
  }, z.literal(canonical)) as z.ZodType<typeof canonical>;
}

/** Model output varies: strings vs arrays, numbers, `{ name: "x" }`, etc. */
function looseStringList(v: unknown): string[] {
  if (v == null) return [];
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return [];
    if (t.includes(',')) return t.split(',').map((s) => s.trim()).filter(Boolean);
    return [t];
  }
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (item == null) continue;
    if (typeof item === 'string') {
      const s = item.trim();
      if (s) out.push(s);
    } else if (typeof item === 'number' || typeof item === 'boolean') {
      out.push(String(item));
    } else if (typeof item === 'object' && item !== null && 'name' in (item as object)) {
      out.push(String((item as { name: unknown }).name ?? ''));
    } else if (typeof item === 'object' && item !== null && 'slug' in (item as object)) {
      out.push(String((item as { slug: unknown }).slug ?? ''));
    }
  }
  return out.filter(Boolean);
}

const stringArray = z.preprocess((v) => looseStringList(v), z.array(z.string()));

function normalizeShippingScope(v: unknown): 'local' | 'national' | 'international' | null {
  const k = normalizeEntityTypeKey(v);
  if (!k) return null;
  // Order matters: "international" contains "national".
  if (['international', 'global', 'worldwide', 'export'].includes(k) || k.startsWith('internat')) {
    return 'international';
  }
  if (
    ['national', 'countrywide', 'canada_wide', 'canada'].includes(k) ||
    (k.includes('national') && !k.startsWith('inter'))
  ) {
    return 'national';
  }
  if (['local', 'regional'].includes(k) || k.includes('local')) return 'local';
  if (['local', 'national', 'international'].includes(k)) return k as 'local' | 'national' | 'international';
  return null;
}

function normalizeTypicalJobSize(v: unknown): 'prototype' | 'low_volume' | 'medium_volume' | 'high_volume' | null {
  const k = normalizeEntityTypeKey(v);
  if (!k) return null;
  if (
    [
      'prototype',
      'prototyping',
      'proto',
      'rd',
      'r_and_d',
    ].includes(k) ||
    k.includes('prototyp')
  ) {
    return 'prototype';
  }
  if (k.includes('high') && k.includes('volume')) return 'high_volume';
  if (k.includes('medium') && k.includes('volume')) return 'medium_volume';
  if (k.includes('low') && k.includes('volume')) return 'low_volume';
  if (['low_volume', 'low_vol', 'lowvol', 'small_batch'].includes(k)) return 'low_volume';
  if (['medium_volume', 'medium_vol', 'med_volume'].includes(k)) return 'medium_volume';
  if (['high_volume', 'high_vol', 'mass_production', 'production'].includes(k)) return 'high_volume';
  if (['prototype', 'low_volume', 'medium_volume', 'high_volume'].includes(k)) {
    return k as 'prototype' | 'low_volume' | 'medium_volume' | 'high_volume';
  }
  return null;
}

function normalizeLeadTimeCategory(
  v: unknown
):
  | 'one_two_weeks'
  | 'two_four_weeks'
  | 'one_three_months'
  | 'three_plus_months'
  | 'depends_on_workload'
  | null {
  const k = normalizeEntityTypeKey(v);
  if (!k) return null;
  const canon = [
    'one_two_weeks',
    'two_four_weeks',
    'one_three_months',
    'three_plus_months',
    'depends_on_workload',
  ] as const;
  if ((canon as readonly string[]).includes(k)) return k as (typeof canon)[number];
  if (k.includes('depends') || k.includes('varies') || k === 'tbd') return 'depends_on_workload';
  if (k.includes('three_plus') || k.includes('3_plus') || k.includes('months_plus')) {
    return 'three_plus_months';
  }
  if ((k.includes('1_3') || k.includes('one_three')) && k.includes('month')) return 'one_three_months';
  if ((k.includes('2_4') || k.includes('two_four')) && k.includes('week')) return 'two_four_weeks';
  if ((k.includes('1_2') || k.includes('one_two')) && k.includes('week')) return 'one_two_weeks';
  return null;
}

function normalizeCommercialProfileInput(raw: unknown): {
  shipping_scope: 'local' | 'national' | 'international' | null;
  typical_job_size: 'prototype' | 'low_volume' | 'medium_volume' | 'high_volume' | null;
  lead_time_category:
    | 'one_two_weeks'
    | 'two_four_weeks'
    | 'one_three_months'
    | 'three_plus_months'
    | 'depends_on_workload'
    | null;
} {
  const empty = {
    shipping_scope: null,
    typical_job_size: null,
    lead_time_category: null,
  };
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...empty };
  }
  const o = raw as Record<string, unknown>;
  return {
    shipping_scope: normalizeShippingScope(o.shipping_scope),
    typical_job_size: normalizeTypicalJobSize(o.typical_job_size),
    lead_time_category: normalizeLeadTimeCategory(o.lead_time_category),
  };
}

const commercialProfileSchema = z.preprocess(
  (raw) => normalizeCommercialProfileInput(raw),
  z.object({
    shipping_scope: z.enum(['local', 'national', 'international']).nullable(),
    typical_job_size: z.enum(['prototype', 'low_volume', 'medium_volume', 'high_volume']).nullable(),
    lead_time_category: z
      .enum([
        'one_two_weeks',
        'two_four_weeks',
        'one_three_months',
        'three_plus_months',
        'depends_on_workload',
      ])
      .nullable(),
  })
);

const nullableStr = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}, z.union([z.string(), z.null()]));

const number01 = z.preprocess((v) => {
  if (v == null || v === '') return 0;
  if (typeof v === 'string') {
    const t = v.trim().replace(/%$/, '');
    const n = Number(t);
    if (Number.isFinite(n)) return n > 1 ? Math.min(1, n / 100) : n;
    return 0;
  }
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n > 1 ? n / 100 : n));
}, z.number().min(0).max(1));

const locationCa = z.object({
  city: nullableStr,
  province_code: nullableStr,
  /** Only "CA" is accepted; other values are coerced to null so validation survives sloppy model output. */
  country_code: z.preprocess(
    (v) => (v === 'CA' ? 'CA' : null),
    z.union([z.literal('CA'), z.null()])
  ),
});

export const supplierAiOutputSchema = z.object({
  entity_type: entityTypeLiteral('supplier_profile', [
    'supplier',
    'supplier_profiles',
    'manufacturer',
    'seller',
    'seller_profile',
    'manufacturing_supplier',
  ]),
  company_name: nullableStr,
  normalized_location: locationCa.default({ city: null, province_code: null, country_code: null }),
  normalized_capabilities: z
    .object({
      processes: stringArray,
      materials: stringArray,
      finishes: stringArray,
      certifications: stringArray,
      industries: stringArray,
      services: stringArray,
      company_types: stringArray,
    })
    .default({
      processes: [],
      materials: [],
      finishes: [],
      certifications: [],
      industries: [],
      services: [],
      company_types: [],
    }),
  commercial_profile: commercialProfileSchema.default({
    shipping_scope: null,
    typical_job_size: null,
    lead_time_category: null,
  }),
  core_capabilities: stringArray,
  search_keywords: stringArray,
  summary: nullableStr,
  explicit_source_terms: stringArray,
  inferred_terms: stringArray,
  confidence: number01.default(0),
});

export type SupplierAiOutput = z.infer<typeof supplierAiOutputSchema>;

export const buyerAiOutputSchema = z.object({
  entity_type: entityTypeLiteral('buyer_profile', ['buyer', 'buyer_profiles', 'buyer_account']),
  company_name: nullableStr,
  normalized_location: locationCa.default({ city: null, province_code: null, country_code: null }),
  organization_profile: z
    .object({
      buyer_type: nullableStr,
      industries: stringArray,
      procurement_keywords: stringArray,
    })
    .default({ buyer_type: null, industries: [], procurement_keywords: [] }),
  search_keywords: stringArray,
  summary: nullableStr,
  confidence: number01.default(0),
});

export type BuyerAiOutput = z.infer<typeof buyerAiOutputSchema>;

export const storefrontProfileAiOutputSchema = z.object({
  entity_type: entityTypeLiteral('storefront_profile', [
    'storefront',
    'storefront_seller',
    'storefront_account',
    'seller_storefront',
  ]),
  company_name: nullableStr,
  normalized_location: locationCa.default({ city: null, province_code: null, country_code: null }),
  seller_profile: z
    .object({
      seller_category: nullableStr,
      likely_listing_types: stringArray,
    })
    .default({ seller_category: null, likely_listing_types: [] }),
  search_keywords: stringArray,
  summary: nullableStr,
  confidence: number01.default(0),
});

export type StorefrontProfileAiOutput = z.infer<typeof storefrontProfileAiOutputSchema>;

export const sourcingRequestAiOutputSchema = z.object({
  entity_type: entityTypeLiteral('sourcing_request', [
    'sourcing',
    'wishlist',
    'wishlist_request',
    'buyer_need',
    'rfq',
  ]),
  request_type: z.preprocess((v: unknown) => {
    const k = normalizeEntityTypeKey(v);
    if (!k || k === 'buyer_need' || k === 'sourcing' || k === 'wishlist' || k === 'rfq') {
      return 'buyer_need';
    }
    return v;
  }, z.literal('buyer_need')),
  title: nullableStr,
  normalized_location: z
    .object({
      target_city: nullableStr,
      target_province_code: nullableStr,
      country_code: z.preprocess(
        (v) => (v === 'CA' ? 'CA' : null),
        z.union([z.literal('CA'), z.null()])
      ),
    })
    .default({ target_city: null, target_province_code: null, country_code: null }),
  normalized_requirements: z
    .object({
      processes: stringArray,
      materials: stringArray,
      finishes: stringArray,
      certifications: stringArray,
      industries: stringArray,
      services: stringArray,
    })
    .default({
      processes: [],
      materials: [],
      finishes: [],
      certifications: [],
      industries: [],
      services: [],
    }),
  commercial_requirements: z
    .object({
      quantity_text: nullableStr,
      target_price_text: nullableStr,
      deadline_iso: nullableStr,
    })
    .default({ quantity_text: null, target_price_text: null, deadline_iso: null }),
  search_keywords: stringArray,
  summary: nullableStr,
  confidence: number01.default(0),
});

export type SourcingRequestAiOutput = z.infer<typeof sourcingRequestAiOutputSchema>;

export const storefrontListingAiOutputSchema = z.object({
  entity_type: entityTypeLiteral('storefront_listing', [
    'listing',
    'store_listing',
    'marketplace_listing',
    'inventory_listing',
  ]),
  listing_class: z.enum(['inventory', 'equipment', 'machine_time', 'space', 'service', 'other']),
  title: nullableStr,
  normalized_attributes: z
    .object({
      processes: stringArray,
      materials: stringArray,
      equipment_types: stringArray,
      industries: stringArray,
      condition: nullableStr,
      location_text: nullableStr,
    })
    .default({
      processes: [],
      materials: [],
      equipment_types: [],
      industries: [],
      condition: null,
      location_text: null,
    }),
  commercial_terms: z
    .object({
      price_text: nullableStr,
    })
    .default({ price_text: null }),
  search_keywords: stringArray,
  summary: nullableStr,
  confidence: number01.default(0),
});

export type StorefrontListingAiOutput = z.infer<typeof storefrontListingAiOutputSchema>;
