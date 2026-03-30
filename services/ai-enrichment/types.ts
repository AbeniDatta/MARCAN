/** Lifecycle stored in `aiStatus` */
export type AiEnrichmentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export type EntityKind =
  | 'supplier_profile'
  | 'buyer_profile'
  | 'storefront_profile'
  | 'sourcing_request'
  | 'storefront_listing';
