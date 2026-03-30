-- AI enrichment columns (JSONB + lifecycle) for marketplace entities

ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "ai_schema" JSONB;
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "ai_summary" TEXT;
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "ai_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "ai_enriched_at" TIMESTAMPTZ(6);
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "ai_error" TEXT;
CREATE INDEX IF NOT EXISTS "buyer_profiles_ai_status_idx" ON "buyer_profiles"("ai_status");

ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "ai_schema" JSONB;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "ai_summary" TEXT;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "ai_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "ai_enriched_at" TIMESTAMPTZ(6);
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "ai_error" TEXT;
CREATE INDEX IF NOT EXISTS "supplier_profiles_ai_status_idx" ON "supplier_profiles"("ai_status");

ALTER TABLE "storefront_profiles" ADD COLUMN IF NOT EXISTS "ai_schema" JSONB;
ALTER TABLE "storefront_profiles" ADD COLUMN IF NOT EXISTS "ai_summary" TEXT;
ALTER TABLE "storefront_profiles" ADD COLUMN IF NOT EXISTS "ai_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "storefront_profiles" ADD COLUMN IF NOT EXISTS "ai_enriched_at" TIMESTAMPTZ(6);
ALTER TABLE "storefront_profiles" ADD COLUMN IF NOT EXISTS "ai_error" TEXT;
CREATE INDEX IF NOT EXISTS "storefront_profiles_ai_status_idx" ON "storefront_profiles"("ai_status");

ALTER TABLE "storefront_listings" ADD COLUMN IF NOT EXISTS "ai_schema" JSONB;
ALTER TABLE "storefront_listings" ADD COLUMN IF NOT EXISTS "ai_summary" TEXT;
ALTER TABLE "storefront_listings" ADD COLUMN IF NOT EXISTS "ai_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "storefront_listings" ADD COLUMN IF NOT EXISTS "ai_enriched_at" TIMESTAMPTZ(6);
ALTER TABLE "storefront_listings" ADD COLUMN IF NOT EXISTS "ai_error" TEXT;
CREATE INDEX IF NOT EXISTS "storefront_listings_ai_status_idx" ON "storefront_listings"("ai_status");

ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "ai_schema" JSONB;
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "ai_summary" TEXT;
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "ai_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "ai_enriched_at" TIMESTAMPTZ(6);
ALTER TABLE "sourcing_requests" ADD COLUMN IF NOT EXISTS "ai_error" TEXT;
CREATE INDEX IF NOT EXISTS "sourcing_requests_ai_status_idx" ON "sourcing_requests"("ai_status");
