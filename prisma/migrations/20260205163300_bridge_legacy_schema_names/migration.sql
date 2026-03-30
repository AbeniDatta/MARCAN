-- Bridge: early migrations created `profiles` and `wishlist_requests` linked to it.
-- Later renames assumed `seller_profiles` → `supplier_profiles`, which never existed on a fresh DB.
-- This migration aligns names/FKs so shadow DB + `prisma migrate dev` can apply subsequent SQL.

-- 1) profiles → supplier_profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles'
  ) THEN
    ALTER TABLE "profiles" RENAME TO "supplier_profiles";
  END IF;
END $$;

-- 2) profile_capabilities.profile_id → supplier_profile_id + FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_capabilities' AND column_name = 'profile_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_capabilities' AND column_name = 'supplier_profile_id'
  ) THEN
    ALTER TABLE "profile_capabilities" DROP CONSTRAINT IF EXISTS "profile_capabilities_profile_id_fkey";
    ALTER TABLE "profile_capabilities" RENAME COLUMN "profile_id" TO "supplier_profile_id";
    ALTER TABLE "profile_capabilities"
      ADD CONSTRAINT "profile_capabilities_supplier_profile_id_fkey"
      FOREIGN KEY ("supplier_profile_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) buyer_profiles (required before wishlist/sourcing can reference buyers)
CREATE TABLE IF NOT EXISTS "buyer_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "province" TEXT,
    "deactivated" BOOLEAN NOT NULL DEFAULT false,
    "deactivated_at" TIMESTAMPTZ(6),
    "scheduled_deletion_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "buyer_profiles_user_id_key" ON "buyer_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "buyer_profiles_province_idx" ON "buyer_profiles"("province");
CREATE INDEX IF NOT EXISTS "buyer_profiles_created_at_idx" ON "buyer_profiles"("created_at" DESC);

-- 4) wishlist_requests.profile_id → buyer_profile_id (table may later rename to sourcing_requests)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_requests' AND column_name = 'profile_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_requests' AND column_name = 'buyer_profile_id'
  ) THEN
    ALTER TABLE "wishlist_requests" DROP CONSTRAINT IF EXISTS "wishlist_requests_profile_id_fkey";
    ALTER TABLE "wishlist_requests" RENAME COLUMN "profile_id" TO "buyer_profile_id";
    ALTER TABLE "wishlist_requests"
      ADD CONSTRAINT "wishlist_requests_buyer_profile_id_fkey"
      FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 4b) Same fix if the table was already renamed to sourcing_requests (e.g. partial migrate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sourcing_requests' AND column_name = 'profile_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sourcing_requests' AND column_name = 'buyer_profile_id'
  ) THEN
    ALTER TABLE "sourcing_requests" DROP CONSTRAINT IF EXISTS "sourcing_requests_profile_id_fkey";
    ALTER TABLE "sourcing_requests" DROP CONSTRAINT IF EXISTS "wishlist_requests_profile_id_fkey";
    ALTER TABLE "sourcing_requests" RENAME COLUMN "profile_id" TO "buyer_profile_id";
    ALTER TABLE "sourcing_requests"
      ADD CONSTRAINT "sourcing_requests_buyer_profile_id_fkey"
      FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 5) storefront_profiles (needed before AI columns migration alters it)
CREATE TABLE IF NOT EXISTS "storefront_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT,
    "street_address" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "business_number" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "about_us" TEXT,
    "logo_url" TEXT,
    "selected_icon" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "profile_completeness_score" INTEGER NOT NULL DEFAULT 0,
    "onboarding_method" "OnboardingMethod",
    "taxonomy_version" TEXT NOT NULL DEFAULT 'v1',
    "last_verified_at" TIMESTAMPTZ(6),
    "deactivated" BOOLEAN NOT NULL DEFAULT false,
    "deactivated_at" TIMESTAMPTZ(6),
    "scheduled_deletion_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storefront_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "storefront_profiles_user_id_key" ON "storefront_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "storefront_profiles_province_idx" ON "storefront_profiles"("province");
CREATE INDEX IF NOT EXISTS "storefront_profiles_verified_idx" ON "storefront_profiles"("verified");
CREATE INDEX IF NOT EXISTS "storefront_profiles_created_at_idx" ON "storefront_profiles"("created_at" DESC);
