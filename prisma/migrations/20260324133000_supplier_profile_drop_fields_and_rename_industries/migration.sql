-- SupplierProfile changes:
-- - drop user_id, logo_url, selected_icon, primary_intent
-- - rename industry_hubs to industries_served
-- - ensure email is NOT NULL + UNIQUE

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'industry_hubs'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'industries_served'
  ) THEN
    ALTER TABLE "supplier_profiles" RENAME COLUMN "industry_hubs" TO "industries_served";
  END IF;
END $$;

ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "logo_url";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "selected_icon";
ALTER TABLE "supplier_profiles" DROP COLUMN IF EXISTS "primary_intent";

-- Normalize email before making it required/unique
UPDATE "supplier_profiles"
SET "email" = CONCAT('supplier_', "id"::text, '@placeholder.local')
WHERE "email" IS NULL OR BTRIM("email") = '';

ALTER TABLE "supplier_profiles" ALTER COLUMN "email" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'supplier_profiles_email_key'
  ) THEN
    CREATE UNIQUE INDEX "supplier_profiles_email_key" ON "supplier_profiles"("email");
  END IF;
END $$;

