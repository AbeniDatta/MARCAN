/**
 * AI enrichment for Marcan marketplace entities.
 * Call `schedule*` helpers after a successful DB write so HTTP responses are not blocked.
 * Failures are logged and persisted on the row (`aiStatus`, `aiError`).
 */

export { enrichBuyerProfile } from './enrichBuyerProfile';
export { enrichStorefrontProfile } from './enrichStorefrontProfile';
export { enrichSourcingRequest } from './enrichSourcingRequest';
export { enrichStorefrontListing } from './enrichStorefrontListing';
export { enrichSupplierProfile } from './enrichSupplierProfile';

export * from './schemas';
export * from './taxonomy';
export * from './utils';
export { getEnrichmentOpenAI, getEnrichmentModel } from './openai-client';

import { enrichBuyerProfile } from './enrichBuyerProfile';
import { enrichStorefrontProfile } from './enrichStorefrontProfile';
import { enrichSourcingRequest } from './enrichSourcingRequest';
import { enrichStorefrontListing } from './enrichStorefrontListing';
import { enrichSupplierProfile } from './enrichSupplierProfile';

function logFireAndForget(entity: string, id: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[ai-enrichment] ${entity} ${id} failed:`, msg);
}

/** Non-blocking supplier profile enrichment */
export function scheduleSupplierProfileEnrichment(supplierProfileId: string): void {
  void enrichSupplierProfile(supplierProfileId).catch((err) =>
    logFireAndForget('supplier_profile', supplierProfileId, err)
  );
}

export function scheduleBuyerProfileEnrichment(buyerProfileId: string): void {
  void enrichBuyerProfile(buyerProfileId).catch((err) =>
    logFireAndForget('buyer_profile', buyerProfileId, err)
  );
}

export function scheduleStorefrontProfileEnrichment(storefrontProfileId: string): void {
  void enrichStorefrontProfile(storefrontProfileId).catch((err) =>
    logFireAndForget('storefront_profile', storefrontProfileId, err)
  );
}

export function scheduleSourcingRequestEnrichment(sourcingRequestId: string): void {
  void enrichSourcingRequest(sourcingRequestId).catch((err) =>
    logFireAndForget('sourcing_request', sourcingRequestId, err)
  );
}

export function scheduleStorefrontListingEnrichment(listingId: string): void {
  void enrichStorefrontListing(listingId).catch((err) =>
    logFireAndForget('storefront_listing', listingId, err)
  );
}
