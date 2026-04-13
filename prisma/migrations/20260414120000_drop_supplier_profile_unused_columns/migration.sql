-- Drop unused supplier_profiles columns (lead time kept as min/max days only).

ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "shipping_capability";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "min_order_qty";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "typical_lead_time";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "profile_completeness_score";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "taxonomy_version";

DROP TYPE IF EXISTS "TypicalLeadTime";
