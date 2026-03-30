import { z } from 'zod';

const stringArray = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.string())
);

const nullableStr = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}, z.union([z.string(), z.null()]));

const number01 = z.preprocess(
  (v) => (typeof v === 'string' ? Number(v) : v),
  z.number().min(0).max(1)
);

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
  entity_type: z.literal('supplier_profile'),
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
  commercial_profile: z
    .object({
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
    .default({
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
  entity_type: z.literal('buyer_profile'),
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
  entity_type: z.literal('storefront_profile'),
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
  entity_type: z.literal('sourcing_request'),
  request_type: z.literal('buyer_need'),
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
  entity_type: z.literal('storefront_listing'),
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
