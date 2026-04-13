-- Drop unused storefront profile searchable column.
ALTER TABLE "storefront_profiles"
DROP COLUMN IF EXISTS "searchable";
