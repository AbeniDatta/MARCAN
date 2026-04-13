-- Drop unused storefront_listings columns (badge, image, redundant category/condition; listing_type remains).
ALTER TABLE "storefront_listings" DROP COLUMN IF EXISTS "badge";
ALTER TABLE "storefront_listings" DROP COLUMN IF EXISTS "image_url";
ALTER TABLE "storefront_listings" DROP COLUMN IF EXISTS "category";
ALTER TABLE "storefront_listings" DROP COLUMN IF EXISTS "condition";
