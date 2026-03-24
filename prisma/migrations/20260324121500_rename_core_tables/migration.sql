-- Rename core tables to requested names.
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'listings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'storefront_listings'
  ) THEN
    ALTER TABLE "listings" RENAME TO "storefront_listings";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wishlist_requests'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sourcing_requests'
  ) THEN
    ALTER TABLE "wishlist_requests" RENAME TO "sourcing_requests";
  END IF;
END $$;

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

