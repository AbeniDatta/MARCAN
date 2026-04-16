-- Add trusted_by array for supplier profile "Trusted By" companies.
ALTER TABLE "supplier_profiles"
ADD COLUMN IF NOT EXISTS "trusted_by" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
