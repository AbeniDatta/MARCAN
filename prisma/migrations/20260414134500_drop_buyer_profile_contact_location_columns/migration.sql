-- Remove unused buyer profile contact/location columns.
ALTER TABLE "buyer_profiles"
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "city",
DROP COLUMN IF EXISTS "province";

-- Drop legacy index if present.
DROP INDEX IF EXISTS "buyer_profiles_province_idx";
