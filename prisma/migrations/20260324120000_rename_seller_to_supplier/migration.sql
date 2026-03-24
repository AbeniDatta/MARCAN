-- Rename seller naming to supplier naming at the database layer.
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'seller_profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles'
  ) THEN
    ALTER TABLE "seller_profiles" RENAME TO "supplier_profiles";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profile_capabilities'
      AND column_name = 'seller_profile_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profile_capabilities'
      AND column_name = 'supplier_profile_id'
  ) THEN
    ALTER TABLE "profile_capabilities" RENAME COLUMN "seller_profile_id" TO "supplier_profile_id";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'seller_profiles_searchable_idx'
  ) THEN
    ALTER INDEX "seller_profiles_searchable_idx" RENAME TO "supplier_profiles_searchable_idx";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'seller_profiles_province_idx'
  ) THEN
    ALTER INDEX "seller_profiles_province_idx" RENAME TO "supplier_profiles_province_idx";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'seller_profiles_verified_idx'
  ) THEN
    ALTER INDEX "seller_profiles_verified_idx" RENAME TO "supplier_profiles_verified_idx";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'seller_profiles_created_at_idx'
  ) THEN
    ALTER INDEX "seller_profiles_created_at_idx" RENAME TO "supplier_profiles_created_at_idx";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'seller_profiles_user_id_key'
  ) THEN
    ALTER INDEX "seller_profiles_user_id_key" RENAME TO "supplier_profiles_user_id_key";
  END IF;
END $$;

