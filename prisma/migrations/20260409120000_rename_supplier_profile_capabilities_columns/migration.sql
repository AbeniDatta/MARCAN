-- SupplierProfile column renames:
-- - industries_served -> capabilities
-- - capabilities -> primary_processes
--
-- This matches the updated Prisma model:
--   SupplierProfile.capabilities      @db.Text   (formerly industries_served)
--   SupplierProfile.primaryProcesses  @map("primary_processes") (formerly capabilities)

DO $$
BEGIN
  -- Common legacy state: both columns exist.
  -- Do the two-step rename in the safe order.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'industries_served'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'capabilities'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'primary_processes'
  ) THEN
    ALTER TABLE "supplier_profiles" RENAME COLUMN "capabilities" TO "primary_processes";
    ALTER TABLE "supplier_profiles" RENAME COLUMN "industries_served" TO "capabilities";
    RETURN;
  END IF;

  -- Alternate legacy state: industries_served exists but capabilities does not.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'industries_served'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'capabilities'
  ) THEN
    ALTER TABLE "supplier_profiles" RENAME COLUMN "industries_served" TO "capabilities";
  END IF;

  -- Alternate legacy state: capabilities exists and needs to become primary_processes (only if no rename collision).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'capabilities'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'primary_processes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_profiles' AND column_name = 'industries_served'
  ) THEN
    ALTER TABLE "supplier_profiles" RENAME COLUMN "capabilities" TO "primary_processes";
  END IF;
END $$;

